var chai = require('chai');
var assert = chai.assert;
var sinon = require('sinon');

var Client = require('./../lib/client');
var Request = require('./../lib/request');
var redis = require('./../lib/redis');

describe('Service', function () {
  describe('Constructor', function () {
    beforeEach(function () {
      sinon.stub(redis, 'client').returns({});
      sinon.stub(redis, 'sub').returns({});
      sinon.stub(Client.prototype, 'setup');
    });
    it('should create service with name', function () {
      var client = new Client('test');
      assert.equal(client.serviceName, 'test');
    });
    it('should create service with id', function () {
      var client = new Client('test');
      assert.isNotNull(client.id);
    });
    it('should create service with client', function () {
      var client = new Client('test');
      assert.isNotNull(client._client);
    });
    it('should create service with sub client', function () {
      var client = new Client('test');
      assert.isNotNull(client._sub);
    });
    it('should call setup method', function () {
      var client = new Client('test');
      assert(client.setup.calledOnce);
    });
    afterEach(function () {
      redis.client.restore();
      redis.sub.restore();
      Client.prototype.setup.restore();
    });
  });
  describe('Function: setup', function () {
    beforeEach(function () {
      sinon.stub(redis, 'client').returns({});
      sinon.stub(redis, 'sub').returns({
        on: sinon.spy(),
        once: function (name, callback) {
          callback();
        },
        subscribe: sinon.spy()
      });
    });
    it('should call once and wait for ready event', function () {
      var client;
      redis.sub.restore();
      sinon.stub(redis, 'sub').returns({
        on: sinon.spy(),
        once: sinon.spy(),
        subscribe: sinon.spy()
      });
      client = new Client('test');
      assert(client._sub.once.calledWith('ready'));
    });
    it('should call on method and wait for message event', function () {
      var client = new Client('test');
      assert(client._sub.on.calledWith('message'));
    });
    it('should subscribe to sub', function () {
      var client = new Client('test');
      assert(client._sub.subscribe.calledWith(client.serviceName + client.id));
    });
    afterEach(function () {
      redis.client.restore();
      redis.sub.restore();
    });
  });
  describe('Function: request', function () {
    beforeEach(function () {
      sinon.stub(redis, 'client').returns({});
      sinon.stub(redis, 'sub').returns({});
      sinon.stub(Client.prototype, 'setup');
    });
    it('should return request with data', function () {
      var client = new Client('test');
      var callback = function () {
      };
      var request = client.request('test', { a: 1 }, callback);
      assert.equal(request.method, 'test');
      assert.equal(request.data.a, 1);
      assert.equal(request.callback, callback);
    });
    afterEach(function () {
      redis.client.restore();
      redis.sub.restore();
      Client.prototype.setup.restore();
    });
  });
  describe('Function: send', function () {
    beforeEach(function () {
      sinon.stub(redis, 'sub').returns({});
      sinon.stub(Client.prototype, 'setup');
    });
    it('should call lpush', function () {
      var client;
      var request;
      sinon.stub(redis, 'client').returns({
        expire: sinon.stub(),
        lpush: sinon.stub()
      });
      client = new Client('test');
      request = new Request('test', { a: 1 });
      client.send(request);
      assert(client._client.lpush.calledWith(client.serviceName,
        request.toJSON(client.serviceName + client.id)));
    });
    it('should remove request if return error from lpush', function () {
      var client;
      var request;
      sinon.stub(redis, 'client').returns({
        expire: sinon.stub(),
        lpush: function (name, value, callback) {
          callback(new Error());
        }
      });
      sinon.spy(Client.prototype, 'removeRequest');
      client = new Client('test');
      request = new Request('test', { a: 1 });
      client.send(request);
      assert(Client.prototype.removeRequest.calledOnce);
      Client.prototype.removeRequest.restore();
    });
    it('should call callback with error if return error from lpush', function () {
      var client;
      var request;
      sinon.stub(redis, 'client').returns({
        expire: sinon.stub(),
        lpush: function (name, value, callback) {
          callback(new Error());
        }
      });
      client = new Client('test');
      request = new Request('test', { a: 1 });
      client.send(request, function (err) {
        assert.isNotNull(err);
      });
    });
    it('should call callback', function () {
      var client;
      var request;
      var callbackSend;
      sinon.stub(redis, 'client').returns({
        expire: sinon.stub(),
        lpush: function (name, value, callback) {
          callback();
        }
      });
      client = new Client('test');
      request = new Request('test', { a: 1 });
      callbackSend = sinon.spy();
      client.send(request, callbackSend);
      assert(callbackSend.calledOnce);
    });
    it('should call expire', function () {
      var client;
      var request;
      sinon.stub(redis, 'client').returns({
        expire: sinon.stub(),
        lpush: function (name, value, callback) {
          callback();
        }
      });
      client = new Client('test');
      request = new Request('test', { a: 1 });
      client.send(request);
      assert(client._client.expire.calledWith(client.serviceName, 30 * 60));
    });
    afterEach(function () {
      redis.client.restore();
      redis.sub.restore();
      Client.prototype.setup.restore();
    });
  });
  describe('Function: onEvent', function () {
    beforeEach(function () {
      sinon.stub(redis, 'client').returns({});
      sinon.stub(redis, 'sub').returns({});
      sinon.stub(Client.prototype, 'setup');
    });
    it('should not throw error if not message', function () {
      var client = new Client('test');
      assert.doesNotThrow(function () {
        client.onEvent(null, null);
      });
    });
    it('should emit event if request exists', function () {
      var client = new Client('test');
      var request = client.request('test', { a: 1 });
      var event = {
        id: request.id,
        status: 'test',
        data: 1
      };
      sinon.spy(request, 'emit');
      client._requests[request.id] = request;
      client.onEvent(1, JSON.stringify(event));
      assert(request.emit.calledWith('test', 1));
    });
    it('should remove request if status succeeded', function () {
      var client = new Client('test');
      var request = client.request('test', { a: 1 });
      var event = {
        id: request.id,
        status: 'succeeded',
        data: 1
      };
      sinon.spy(client, 'removeRequest');
      client._requests[request.id] = request;
      client.onEvent(1, JSON.stringify(event));
      assert(client.removeRequest.calledOnce);
    });
    it('should remove request if status failed', function () {
      var client = new Client('test');
      var request = client.request('test', { a: 1 });
      var event = {
        id: request.id,
        status: 'failed',
        data: 1
      };
      sinon.spy(client, 'removeRequest');
      client._requests[request.id] = request;
      client.onEvent(1, JSON.stringify(event));
      assert(client.removeRequest.calledOnce);
    });
    it('should call callback if status succeeded', function () {
      var client = new Client('test');
      var callback = sinon.spy();
      var request = client.request('test', { a: 1 }, callback);
      var event = {
        id: request.id,
        status: 'succeeded',
        data: 1
      };
      client._requests[request.id] = request;
      client.onEvent(1, JSON.stringify(event));
      assert(callback.calledWith(undefined, 1));
    });
    it('should call callback  if status failed', function () {
      var client = new Client('test');
      var callback = sinon.spy();
      var request = client.request('test', { a: 1 }, callback);
      var event = {
        id: request.id,
        status: 'failed',
        error: 'Error'
      };
      client._requests[request.id] = request;
      client.onEvent(1, JSON.stringify(event));
      assert(callback.calledWith('Error', undefined));
    });
    afterEach(function () {
      redis.client.restore();
      redis.sub.restore();
      Client.prototype.setup.restore();
    });
  });
  describe('Function: addRequest', function () {
    beforeEach(function () {
      sinon.stub(redis, 'client').returns({});
      sinon.stub(redis, 'sub').returns({});
      sinon.stub(Client.prototype, 'setup');
    });
    it('should add request to requests array', function () {
      var client = new Client('test');
      var request = client.request('test', { a: 1 });
      client.addRequest(request);
      assert.isNotNull(client._requests[request.id]);
    });
    afterEach(function () {
      redis.client.restore();
      redis.sub.restore();
      Client.prototype.setup.restore();
    });
  });
  describe('Function: removeRequest', function () {
    beforeEach(function () {
      sinon.stub(redis, 'client').returns({});
      sinon.stub(redis, 'sub').returns({});
      sinon.stub(Client.prototype, 'setup');
    });
    it('should remove request from requests array', function () {
      var client = new Client('test');
      var request = client.request('test', { a: 1 });
      client._requests[request.id] = request;
      assert.isNotNull(client._requests[request.id]);
      client.removeRequest(request);
      assert.isFalse(!!client._requests[request.id]);
    });
    it('should call stopTimer on request', function () {
      var client = new Client('test');
      var request;
      sinon.spy(Request.prototype, 'stopTimeout');
      request = client.request('test', { a: 1 });
      client.removeRequest(request);
      assert(request.stopTimeout.calledOnce);
      Request.prototype.stopTimeout.restore();
    });
    afterEach(function () {
      redis.client.restore();
      redis.sub.restore();
      Client.prototype.setup.restore();
    });
  });
})
;
