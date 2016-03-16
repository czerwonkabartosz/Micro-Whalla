var redis = require('./redis');
var helpers = require('./helpers');
var Request = require('./request');

function Client(serviceName, opts) {
  this.opts = opts || {};
  this.opts.request = this.opts.request || {};

  this.serviceName = serviceName;
  this.id = helpers.generateId();

  this._client = redis.client();
  this._sub = redis.sub();

  this._requests = {};

  this.setup();
}

Client.prototype.request = function (method, data, callback) {
  return new Request(method, data, callback, this);
};

Client.prototype.setup = function () {
  var self = this;

  function listenEvents() {
    self._sub.on('message', self.onEvent.bind(self));
    self._sub.subscribe(self.serviceName + self.id);
  }

  self._sub.once('ready', listenEvents);
};

Client.prototype.onEvent = function (channel, message, cached) {
  var self = this;
  var request;
  var event;

  if (!message) {
    return;
  }

  if (typeof message === 'object') {
    if (message.cached) {
      event = helpers.deserialize(message.event);
      event.id = message.id;
    }
  } else {
    event = helpers.deserialize(message);
  }

  request = self._requests[event.id];
  if (request) {
    request.emit(event.status, event.error ? event.error : event.data);

    if (event.status === 'succeeded' || event.status === 'failed') {
      if (request.options.cache && !cached) {
        self._client.set(request.cacheKey(self.serviceName), message);
        self._client.expire(request.cacheKey(self.serviceName), request.options.cache);
      }

      self.removeRequest(request);

      if (request.callback) {
        request.callback(event.error, event.data);
      }
    }
  }
};

Client.prototype.send = function (request, callback) {
  var self = this;

  function _send() {
    self._client.lpush(self.serviceName, request.toJSON(self.serviceName + self.id),
      function (err) {
        if (err) {
          if (callback) {
            callback(new Error());
          }

          self.removeRequest(request);
          return;
        }
        self._client.expire(self.serviceName, 30 * 60);

        if (callback) {
          callback();
        }
      });
  }

  function _getCache() {
    self._client.get(request.cacheKey(self.serviceName), function (err, event) {
      var _event;
      if (event) {
        _event = {
          id: request.id,
          event: event,
          cached: true
        };

        return self.onEvent(null, _event, true);
      }

      return _send();
    });
  }

  if (request.options.cache) {
    return _getCache();
  }

  return _send();
};

Client.prototype.addRequest = function (request) {
  this._requests[request.id] = request;
};

Client.prototype.removeRequest = function (request) {
  request.stopTimeout();
  delete this._requests[request.id];
};

module.exports = Client;
