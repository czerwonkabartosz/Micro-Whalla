var chai = require('chai');
var assert = chai.assert;
var sinon = require('sinon');

var r = require('redis');

describe('Redis', function () {
  describe('Function: createClient', function () {
    var redis;
    beforeEach(function () {
      redis = require('./../lib/redis');
      sinon.stub(r, 'createClient').returns({});
    });
    it('should return client', function () {
      var client;
      client = redis.createClient();
      assert.isNotNull(client);
    });
    it('should return client with options', function () {
      var client;
      var args;
      client = redis.createClient({ host: '127.0.0.1', port: 1234 });
      assert.isNotNull(client);
      args = r.createClient.getCall(0).args;
      assert.equal(args[0].host, '127.0.0.1');
      assert.equal(args[0].port, 1234);
    });
    afterEach(function () {
      r.createClient.restore();
      delete require.cache[require.resolve('./../lib/redis')];
    });
  });
  describe('Function: client', function () {
    var redis;
    beforeEach(function () {
      redis = require('./../lib/redis');
      sinon.stub(r, 'createClient').returns({});
    });
    it('should return new client if not exists', function () {
      var client;
      client = redis.client();
      assert.isNotNull(client);
      assert(r.createClient.calledOnce);
    });
    it('should return exists client', function () {
      var client;
      client = redis.client();
      client = redis.client();
      assert.isNotNull(client);
      assert(r.createClient.calledOnce);
    });
    afterEach(function () {
      r.createClient.restore();
      delete require.cache[require.resolve('./../lib/redis')];
    });
  });
  describe('Function: events', function () {
    var redis;
    beforeEach(function () {
      redis = require('./../lib/redis');
      sinon.stub(r, 'createClient').returns({});
    });
    it('should return new client if not exists', function () {
      var events;
      events = redis.events();
      assert.isNotNull(events);
      assert(r.createClient.calledOnce);
    });
    it('should return exists client', function () {
      var events;
      events = redis.events();
      events = redis.events();
      assert.isNotNull(events);
      assert(r.createClient.calledOnce);
    });
    afterEach(function () {
      r.createClient.restore();
      delete require.cache[require.resolve('./../lib/redis')];
    });
  });
  describe('Function: init', function () {
    var redis;
    beforeEach(function () {
      redis = require('./../lib/redis');
      sinon.stub(r, 'createClient').returns({});
    });
    it('should set options to create client with options', function () {
      var client;
      var args;
      redis.init({ host: '127.0.0.1', port: 1234 });
      client = redis.client();
      assert.isNotNull(client);
      args = r.createClient.getCall(0).args;
      assert.equal(args[0].host, '127.0.0.1');
      assert.equal(args[0].port, 1234);
    });
    it('should set options to create events with options', function () {
      var events;
      var args;
      redis.init({ host: '127.0.0.1', port: 1234 });
      events = redis.events();
      assert.isNotNull(events);
      args = r.createClient.getCall(0).args;
      assert.equal(args[0].host, '127.0.0.1');
      assert.equal(args[0].port, 1234);
    });
    afterEach(function () {
      r.createClient.restore();
      delete require.cache[require.resolve('./../lib/redis')];
    });
  });
});
