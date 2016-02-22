var events = require('events');
var util = require('util');

var helpers = require('./helpers');

function Request(method, data, callback, client) {
  this.id = helpers.generateId();
  this.method = method;
  this.data = data;
  this.callback = callback;
  this.options = {};

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

      self.emit('error', error);
      if (self.callback) {
        self.callback(error);
      }

      self._client.removeRequest(self);
    }, self.options.timeout);
  }
};

Request.prototype.stopTimeout = function () {
  clearTimeout(this.timeoutHandler);
};

Request.prototype.isExpired = function () {
  return this.sent && this.options.timeout && !this.options.fireAndForget
    ? new Date().getTime() <= this.sent + this.options.timeout : false;
};

Request.fromJson = function (json) {
  var msg = helpers.deserialize(json);

  var request = new Request(msg.method, msg.data);
  request.id = msg.id;
  request.clientId = msg.clientId;

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
