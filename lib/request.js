var events = require('events');
var crypto = require('crypto');
var util = require('util');

var helpers = require('./helpers');

function Request(method, data, callback, client) {
  this.id = helpers.generateId();
  this.method = method;
  this.data = data;
  this.callback = callback;
  this.options = {
    timeout: 1000
  };

  this._client = client;
}

util.inherits(Request, events.EventEmitter);

Request.prototype.send = function (callback) {
  if (!this._client) {
    throw new Error();
  }

  this.sent = new Date();

  this._client.send(this, callback);

  if (!this.options.fireAndForget) {
    this.startTimeout();
    this._client.addRequest(this);
  }

  return this;
};

Request.prototype.broadcast = function (callback) {
  this.fireAndForget();

  if (!this._client) {
    throw new Error();
  }

  this.sent = new Date();

  this._client.broadcast(this, callback);
};

Request.prototype.fireAndForget = function () {
  this.options.fireAndForget = true;
  return this;
};

Request.prototype.timeout = function (timeout) {
  if (timeout < 0) {
    throw Error('Timeout can not be less than 0');
  }

  this.options.timeout = timeout;

  return this;
};

Request.prototype.startTimeout = function () {
  var self = this;

  if (self.options.timeout) {
    self.timeoutHandler = setTimeout(function () {
      var error = new Error('Timeout');

      self.emit('failed', error);
      if (self.callback) {
        self.callback(error);
      }

      self._client.removeRequest(self);
    }, self.options.timeout);
  }
};

Request.prototype.stopTimeout = function () {
  clearTimeout(this.timeoutHandler);
  this.timeoutHandler = null;
};

Request.prototype.isExpired = function () {
  return this.sent && this.options.timeout && !this.options.fireAndForget
    ? new Date().getTime() >= this.sent.getTime() + this.options.timeout : false;
};

Request.prototype.cache = function (cacheTime) {
  if (cacheTime < 0) {
    throw Error('Life of cache can not be less than 0');
  }

  this.options.cache = cacheTime;
  return this;
};

Request.prototype.cacheKey = function (serviceName) {
  var key;
  var hash;
  var obj = {
    serviceName: serviceName,
    method: this.method,
    data: this.data,
    options: this.options
  };

  if (this._cacheKey) {
    return this._cacheKey;
  }

  obj = helpers.serialize(obj);
  hash = crypto.createHash('sha256');
  hash.update(obj);
  key = hash.digest('hex');

  this._cacheKey = key;

  return this._cacheKey;
};

Request.fromJson = function (json) {
  var msg = helpers.deserialize(json);

  var request = new Request(msg.method, msg.data);
  request.id = msg.id;
  request.clientId = msg.clientId;
  request.options = msg.options;
  request.sent = msg.sent ? new Date(msg.sent) : null;

  return request;
};

Request.prototype.toJSON = function (clientId) {
  var obj = {
    id: this.id,
    method: this.method,
    data: this.data,
    options: this.options,
    sent: this.sent,
    clientId: clientId
  };

  obj = helpers.serialize(obj);

  return obj;
};

module.exports = Request;
