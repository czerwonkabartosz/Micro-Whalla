var redis = require('./redis');
var helpers = require('./helpers');
var Request = require('./request');

function Client(serviceName, opts) {
  this.opts = opts || {};
  this.opts.request = this.opts.request || {};

  this.serviceName = serviceName;
  this.id = helpers.generateId();

  this._client = redis.client();
  this._events = redis.events();

  this._requests = {};

  this.setup();
}

Client.prototype.request = function (method, data, callback) {
  return new Request(method, data, callback, this);
};

Client.prototype.setup = function () {
  var self = this;

  function listenEvents() {
    self._events.on('message', function (channel, msg) {
      self.onEvent(channel, msg);
    });

    self._events.subscribe(self.serviceName + self.id);
  }

  self._events.once('ready', listenEvents);
};

Client.prototype.onEvent = function (channel, message) {
  var self = this;
  var request;
  var event;

  if (!message) {
    return;
  }

  event = helpers.deserialize(message);

  request = self._requests[event.id];
  if (request) {
    request.emit(event.status, event.error ? event.error : event.data);

    if (event.status === 'success' || event.status === 'error') {
      self.removeRequest(request);

      if (request.callback) {
        request.callback(event.error, event.data);
      }
    }
  }
};

Client.prototype.send = function (request, callback) {
  var self = this;

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
};

Client.prototype.addRequest = function (request) {
  this._requests[request.id] = request;
};

Client.prototype.removeRequest = function (request) {
  request.stopTimeout();
  delete this._requests[request.id];
};

module.exports = Client;
