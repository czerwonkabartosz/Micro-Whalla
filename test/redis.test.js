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
  describe('Function: pub', function () {
    var redis;
    beforeEach(function () {
      redis = require('./../lib/redis');
      sinon.stub(r, 'createClient').returns({});
    });
    it('should return new client if not exists', function () {
      var pub;
      pub = redis.pub();
      assert.isNotNull(pub);
      assert(r.createClient.calledOnce);
    });
    it('should return exists client', function () {
      var pub;
      pub = redis.pub();
      pub = redis.pub();
      assert.isNotNull(pub);
      assert(r.createClient.calledOnce);
    });
    afterEach(function () {
      r.createClient.restore();
      delete require.cache[require.resolve('./../lib/redis')];
    });
  });
  describe('Function: sub', function () {
    var redis;
    beforeEach(function () {
      redis = require('./../lib/redis');
      sinon.stub(r, 'createClient').returns({});
    });
    it('should return new client if not exists', function () {
      var sub;
      sub = redis.sub();
      assert.isNotNull(sub);
      assert(r.createClient.calledOnce);
    });
    it('should return exists client', function () {
      var sub;
      sub = redis.sub();
      sub = redis.sub();
      assert.isNotNull(sub);
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
      var pub;
      var args;
      redis.init({ host: '127.0.0.1', port: 1234 });
      pub = redis.pub();
      assert.isNotNull(pub);
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
