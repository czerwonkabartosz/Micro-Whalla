var events = require('events');
var util = require('util');
var path = require('path');
var _ = require('lodash');
var callsite = require('callsite');
var glob = require('glob');

var redis = require('./redis');
var helpers = require('./helpers');
var Request = require('./request');
var Response = require('./response');

function Service(name, opts) {
  this.opts = opts || {};
  this.opts.concurrency = this.opts.concurrency || 1;
  this.opts.log = this.opts.log || false;

  this.serviceName = name;
  this.id = helpers.generateId();

  this._client = redis.client();
  this._pub = redis.pub();

  this._methods = {};

  this._heartbeat();
}

util.inherits(Service, events.EventEmitter);

Service.prototype._heartbeat = function () {
  var self = this;
  var serviceKey = 'service:' + this.serviceName;

  if (this._client.set) {
    this._client.set(serviceKey, this.serviceName);
    this._client.expire(serviceKey, 2 * 60);

    if (!this.__heartbeatInterval) {
      this._heartbeatInterval = setInterval(self._heartbeat.bind(self), 100000);
    }
  }
};

Service.prototype.register = function (name, handler) {
  var self = this;
  if (!(typeof handler === 'function')) {
    throw new Error('Handler must be a function');
  }

  if (this._methods[name]) {
    throw new Error('This method already exists');
  }

  this._methods[name] = handler.bind(self);
};

Service.prototype.findAndRegisterMethods = function (pattern) {
  var self = this;
  var stack = callsite();
  var requester = stack[1].getFileName();
  var dirname = path.dirname(requester);
  var _pattern = pattern || '/methods/**/*.method.js';

  glob(dirname + _pattern, function (err, methodsFiles) {
    _.each(methodsFiles, function (methodFile) {
      var method = require(methodFile);
      self.register(method.name, method.method.bind(self));
    });
  });
};

Service.prototype.start = function () {
  this.process();
};

Service.prototype.process = function () {
  var self = this;
  var processTick;

  self.running = 0;

  function next(done) {
    self._next(done, processTick);
  }

  function finishProcess(request) {
    var now = new Date();
    var processingTime;
    var delay;

    next(true);

    if (self.opts.log && request) {
      processingTime = now.getTime() - request.startedProcessAt.getTime();
      delay = request.startedProcessAt - request.sent.getTime();

      console.log('MICRO-WHALLA (SERVICE: ' + self.serviceName + ') : ' +
        'PROCESSED REQUEST ' +
        '(receivedAt: ' + request.startedProcessAt + ', ' +
        'delay: ' + delay + ' MS, ' +
        'processingTime: ' + processingTime + ' MS) - ' +
        request.method + ' WITH DATA: ' + request.toJSON()
      );
    }
  }

  processTick = function () {
    self.running += 1;

    self.getNextRequest(function (err, r) {
      var request = r;
      var response;
      var handler;
      var error;

      if (!request || err) {
        if (err) {
          self.emit('error', err);
        }

        next(true);
        return;
      }

      if (self.opts.log) {
        request.startedProcessAt = new Date();
        console.log('MICRO-WHALLA (SERVICE: ' + self.serviceName + ') ' +
          ': RECEIVED REQUEST - ' + request.method + ' - ' + request.id);
      }

      if (request.isExpired()) {
        next(true);
        return;
      }

      if (self.running < self.opts.concurrency) {
        next();
      }

      response = new Response(request, self, finishProcess);
      handler = self._methods[request.method];

      if (handler) {
        try {
          handler(request, response);
        } catch (errHandler) {
          response.error(errHandler);
        }
      } else {
        error = new Error('Method not found');
        response.error(error);
      }
    });
  };

  self._client.on('ready', processTick);
};

Service.prototype._next = function (done, nextFunction) {
  if (done) {
    this.running -= 1;
  }

  setImmediate(nextFunction);
};

Service.prototype.sendEvent = function (clientId, event) {
  this._pub.publish(clientId, helpers.serialize(event));
};

Service.prototype.getNextRequest = function (callback) {
  var self = this;

  self._client.brpop(self.serviceName, 0, function (err, message) {
    if (!message) {
      return callback();
    }

    return callback(null, Request.fromJson(message[1], self));
  });
};

module.exports = Service;
