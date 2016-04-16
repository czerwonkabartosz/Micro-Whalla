var chai = require('chai');
var assert = chai.assert;
var sinon = require('sinon');
var proxyquire = require('proxyquire');

var Service = require('./../lib/service');
var Request = require('./../lib/request');
var Response = require('./../lib/response');
var redis = require('./../lib/redis');

describe('Service', function () {
  describe('Constructor', function () {
    beforeEach(function () {
      sinon.stub(redis, 'client').returns({});
      sinon.stub(redis, 'pub').returns({});
    });
    it('should create service with name', function () {
      var service = new Service('test');
      assert.equal(service.serviceName, 'test');
    });
    it('should create service with id', function () {
      var service = new Service('test');
      assert.isNotNull(service.id);
    });
    it('should create service with client', function () {
      var service = new Service('test');
      assert.isNotNull(service._client);
    });
    it('should create service with pub client', function () {
      var service = new Service('test');
      assert.isNotNull(service._pub);
    });
    it('should create service with default concurrency option', function () {
      var service = new Service('test');
      assert.equal(service.opts.concurrency, 1);
    });
    it('should create service with options', function () {
      var service = new Service('test', { concurrency: 20 });
      assert.equal(service.opts.concurrency, 20);
    });
    afterEach(function () {
      redis.client.restore();
      redis.pub.restore();
    });
  });
  describe('Function: register', function () {
    beforeEach(function () {
      sinon.stub(redis, 'client').returns({});
      sinon.stub(redis, 'pub').returns({});
    });
    it('should throw error if handler is not function', function () {
      var service = new Service('test');
      assert.throw(function () {
        service.register('test', 'function');
      });
    });
    it('should throw error if handler with same name registered', function () {
      var service = new Service('test');
      service.register('test', function () {
      });
      assert.throw(function () {
        service.register('test', function () {
        });
      });
    });
    it('should add handler to methods', function () {
      var service = new Service('test');
      service.register('test', function () {
      });
      assert.isNotNull(service._methods.test);
    });
    afterEach(function () {
      redis.client.restore();
      redis.pub.restore();
    });
  });
  describe('Function: findAndRegisterMethods', function () {
    beforeEach(function () {
      sinon.stub(redis, 'client').returns({});
      sinon.stub(redis, 'pub').returns({});
    });
    it('should find file with method and register in service', function () {
      var fakeMethod = require('./method.fake');
      var args;
      var ServiceProxy = proxyquire('./../lib/service', {
        glob: function (param, callback) {
          callback(null, ['./../test/method.fake']);
        },
        './redis': {
          client: function () {
            return {};
          },
          pub: function () {
            return {};
          }
        }
      });
      var service = new ServiceProxy('test');
      sinon.stub(service, 'register');
      service.findAndRegisterMethods();

      args = service.register.getCall(0).args;

      assert(service.register.calledOnce);
      assert.equal(args[0], fakeMethod.name);
      assert.equal(args[1](), fakeMethod.method());
    });
    afterEach(function () {
      redis.client.restore();
      redis.pub.restore();
    });
  });
  describe('Function: start', function () {
    beforeEach(function () {
      sinon.stub(redis, 'client').returns({});
      sinon.stub(redis, 'pub').returns({});
    });
    it('should call process method', function () {
      var service = new Service('test');
      sinon.stub(service, 'process');
      service.start();
      assert(service.process.calledOnce);
      service.process.restore();
    });
    afterEach(function () {
      redis.client.restore();
      redis.pub.restore();
    });
  });
  describe('Function: sendEvent', function () {
    beforeEach(function () {
      sinon.stub(redis, 'client').returns({});
      sinon.stub(redis, 'pub').returns({ publish: sinon.spy() });
    });
    it('should call publish method on pub', function () {
      var service = new Service('test');
      var event = { id: 1, status: 'test', data: 1 };
      var helper = require('./../lib/helpers');
      service.sendEvent(1, event);
      assert(service._pub.publish.calledOnce);
      assert(service._pub.publish.calledWith(1, helper.serialize(event)));
    });
    afterEach(function () {
      redis.client.restore();
      redis.pub.restore();
    });
  });
  describe('Function: getNextRequest', function () {
    beforeEach(function () {
      sinon.stub(redis, 'client').returns({ brpop: sinon.stub() });
      sinon.stub(redis, 'pub').returns();
    });
    it('should call brpop method with serviceName', function () {
      var service = new Service('test');
      service.getNextRequest(function () {
      });
      assert(service._client.brpop.calledOnce);
      assert(service._client.brpop.calledWith('test', 0));
    });
    it('should call empty callback if not get new message', function () {
      var service = new Service('test');
      service._client.brpop = function (name, timeout, callback) {
        return callback(null, null);
      };
      service.getNextRequest(function (err, request) {
        assert.isFalse(!!err);
        assert.isFalse(!!request);
      });
    });
    it('should call callback with request if get new message', function () {
      var service = new Service('test');
      var request = new Request('method', { a: 1 });
      service._client.brpop = function (name, timeout, callback) {
        return callback(null, request);
      };
      service.getNextRequest(function (err, r) {
        assert.isFalse(!!err);
        assert.isNotNull(r);
      });
    });
    afterEach(function () {
      redis.client.restore();
      redis.pub.restore();
    });
  });
  describe('Function: process', function () {
    var clock;
    beforeEach(function () {
      clock = sinon.useFakeTimers();
      sinon.stub(redis, 'client').returns({
        on: function (name, callback) {
          callback();
        }
      });
      sinon.stub(redis, 'pub').returns({ publish: sinon.spy() });
    });
    it('should set running variable to 0', function () {
      var service;
      redis.client.restore();
      sinon.stub(redis, 'client').returns({
        once: sinon.spy(),
        on: sinon.spy()
      });
      service = new Service('test');
      service.process();
      assert.equal(service.running, 0);
    });
    it('should run processTick and increment running variable', function () {
      var service;
      sinon.stub(Service.prototype, 'getNextRequest');
      service = new Service('test');
      service.process();
      assert.equal(service.running, 1);
      assert(Service.prototype.getNextRequest.calledOnce);
      Service.prototype.getNextRequest.restore();
    });
    it('should decrement running if getNextRequest return error', function () {
      var service;
      service = new Service('test');
      service.on('error', function () {
      });
      service.getNextRequest = function (callback) {
        callback(new Error());
      };
      service.process();
      assert.equal(service.running, 0);
    });
    it('should emit error if getNextRequest return error', function (done) {
      var service;
      service = new Service('test');
      service.on('error', function (error) {
        assert.isNotNull(error);
        done();
      });
      service.getNextRequest = function (callback) {
        callback(new Error());
      };
      service.process();
    });
    it('should ignore request is expired', function () {
      var service;
      sinon.spy(Service.prototype, '_next');
      service = new Service('test');
      service.getNextRequest = function (callback) {
        callback(null, {
          isExpired: function () {
            return true;
          }
        });
      };
      service.process();
      assert(Service.prototype._next.calledOnce);
      Service.prototype._next.restore();
    });
    it('should call response error if method not found', function () {
      var service;
      var request = new Request('test');
      sinon.spy(Response.prototype, 'error');
      service = new Service('test');
      service.on('error', function () {
      });
      service.getNextRequest = function (callback) {
        callback(null, request);
      };
      service.process();
      assert(Response.prototype.error.calledOnce);
      Response.prototype.error.restore();
    });
    it('should call handler', function () {
      var service;
      var request = new Request('test');
      service = new Service('test');
      service._methods.test = sinon.spy();
      service.getNextRequest = function (callback) {
        callback(null, request);
      };
      service.process();
      assert(service._methods.test.calledOnce);
    });
    it('should call response error if handler throw error', function () {
      var service;
      var request = new Request('test');
      sinon.spy(Response.prototype, 'error');
      service = new Service('test');
      service._methods.test = sinon.stub().throws();
      service.getNextRequest = function (callback) {
        callback(null, request);
      };
      service.process();
      assert(service._methods.test.calledOnce);
      assert(Response.prototype.error.calledOnce);
      Response.prototype.error.restore();
    });
    it('should run next processTick if running is smaller then concurrency', function () {
      var service;
      var request = new Request('test');
      sinon.spy(Service.prototype, '_next');
      service = new Service('test');
      service.opts.concurrency = 2;
      service._methods.test = function (req, res) {
        res.done();
      };
      service.getNextRequest = function (callback) {
        callback(null, request);
      };
      service.process();
      assert(Service.prototype._next.calledTwice);
    });
    afterEach(function () {
      clock.restore();
      redis.client.restore();
      redis.pub.restore();
    });
  });
});
