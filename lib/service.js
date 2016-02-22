var events = require('events');
var util = require('util');

var redis = require('./redis');
var helpers = require('./helpers');
var Request = require('./request');
var Response = require('./response');

function Service(name, opts) {
    if (!(this instanceof Service)) {
        return new Service(name, opts);
    }

    this.opts = opts || {};
    this.opts.concurrency = this.opts.concurrency || 1;

    this.serviceName = name;
    this.id = helpers.generateId();

    this._client = redis.client();
    this._events = redis.events();

    this._methods = {};
}

util.inherits(Service, events.EventEmitter);

Service.prototype.register = function (name, handler) {
    if (!(typeof handler === 'function')) {
        throw new Error('Handler must be a function');
    }

    if (this._methods[name]) {
        throw new Error('This method already exists');
    }

    this._methods[name] = handler;
};

Service.prototype.start = function () {
    this.process();
};

Service.prototype.process = function () {
    var self = this;
    self.running = 0;

    var processTick = function () {
        self.running += 1;

        self.getNextRequest(function (err, request) {
            if (err) {
                self.emit('error', err);
                return next(true);
            }

            if (request.isExpired()) {
                return next(true);
            }

            if (self.running < self.opts.concurrency) {
                next();
            }

            var response = new Response(request, self, finishProcess);
            var handler = self._methods[request.method];

            if (handler) {
                try {
                    handler(request, response);
                } catch (err) {
                    response.error(err);
                }
            } else {
                var error = new Error('Method not found');
                self.emit('error', error);
                response.error(error);
            }
        });
    };

    self._client.once('ready', processTick);

    function next(done) {
        if (done) {
            self.running -= 1;
        }

        setImmediate(processTick);
    }

    function finishProcess() {
        next(true);
    }
};

Service.prototype.sendEvent = function (clientId, event) {
    event = helpers.serialize(event);
    this._events.publish(clientId, event);
};

Service.prototype.getNextRequest = function (callback) {
    var self = this;

    self._client.brpop(self.serviceName, 0, function (err, message) {
        if (!message) {
            return callback();
        }

        callback(null, Request.fromJson(message[1], self));
    });
};

module.exports = Service;