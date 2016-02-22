var chai = require('chai');
var assert = chai.assert;
var sinon = require('sinon');

var Request = require('./../lib/request');

describe('Request', function () {
  var clientMock;
  var makeRequest = function (method, params, callback, client) {
    return new Request(method, params, callback, client === undefined ? clientMock : client);
  };

  beforeEach(function () {
    clientMock = {
      send: sinon.spy(),
      addRequest: sinon.spy(),
      removeRequest: sinon.spy()
    };
  });
  describe('Constructor', function () {
    it('creates a request', function () {
      var callback = function () {
        return 1;
      };
      var request = makeRequest('method', { a: 1 }, callback);
      assert.equal(request.method, 'method');
      assert.equal(request.data.a, 1);
      assert.equal(request.callback, callback);
    });
  });
  describe('Options', function () {
    it('set fireAndForget', function () {
      var request = makeRequest('method', { a: 1 });
      request.fireAndForget();
      assert.equal(request.options.fireAndForget, true);
    });
    it('set timeout', function () {
      var request = makeRequest('method', { a: 1 });
      request.timeout(50);
      assert.equal(request.options.timeout, 50);
    });
    it('rejects invalid timeout', function () {
      var request = makeRequest('method', { a: 1 });
      assert.throws(function () {
        request.timeout(-1);
      });
    });
  });
  describe('Timeouts', function () {
    it('emit failed if timeout', function (done) {
      var request = makeRequest('method', { a: 1 }, null);
      request.timeout(50);
      request.send();
      request.on('failed', function (err) {
        assert.isNotNull(err);
        assert(request.sent.getTime() + request.options.timeout <= new Date().getTime());
        done();
      });
    });
    it('return error in callback if timeout', function (done) {
      var request;
      var callback = function (err) {
        assert.isNotNull(err);
        assert(request.sent.getTime() + request.options.timeout <= new Date().getTime());
        done();
      };
      request = makeRequest('method', { a: 1 }, callback);
      request.timeout(50);
      request.send();
    });
    it('start and stop timeout handler', function () {
      var request = makeRequest('method', { a: 1 });
      request.timeout(50);
      request.startTimeout();
      assert.isNotNull(request.timeoutHandler);
      request.stopTimeout();
      assert.isNull(request.timeoutHandler);
    });
  });
  describe('Expires', function () {
    it('not expired if not sent', function () {
      var request = makeRequest('method', { a: 1 });
      assert.isFalse(request.isExpired());
    });
    it('not expired if not set timeout', function () {
      var request = makeRequest('method', { a: 1 });
      request.send();
      assert.isFalse(request.isExpired());
    });
    it('not expired if fire and forget', function () {
      var request = makeRequest('method', { a: 1 });
      request.timeout(1000);
      request.fireAndForget();
      request.send();
      assert.isFalse(request.isExpired());
    });
    it('expired if time elapsed', function (done) {
      var request = makeRequest('method', { a: 1 });
      request.timeout(50);
      request.send();
      request.stopTimeout();

      setTimeout(function () {
        assert.isTrue(request.isExpired());
        done();
      }, 50);
    });
    it('not expired if time not elapsed', function (done) {
      var request = makeRequest('method', { a: 1 });
      request.timeout(50);
      request.send();
      request.stopTimeout();

      setTimeout(function () {
        assert.isFalse(request.isExpired());
        done();
      }, 40);
    });
  });
  describe('Json', function () {
    it('transforms and creates from JSON', function () {
      var clientId = 1;
      var request = makeRequest('method', { a: 1 });
      var json = request.toJSON(clientId);
      var requestFromJson = Request.fromJson(json);
      assert.equal(requestFromJson.id, request.id);
      assert.equal(requestFromJson.method, request.method);
      assert.equal(requestFromJson.data.a, request.data.a);
      assert.equal(requestFromJson.clientId, clientId);
    });
  });
  describe('Send', function () {
    it('send', function () {
      var request = makeRequest('method', { a: 1 });
      request.startTimeout = sinon.spy();

      request.send();

      assert(clientMock.send.calledOnce);
      assert(clientMock.addRequest.calledOnce);
      assert(request.startTimeout.calledOnce);
    });
    it('send with fire and forget', function () {
      var request = makeRequest('method', { a: 1 });
      request.startTimeout = sinon.spy();

      request.fireAndForget();
      request.send();

      assert(clientMock.send.calledOnce);
      assert(clientMock.addRequest.notCalled);
      assert(request.startTimeout.notCalled);
    });
    it('send without client', function () {
      var request = makeRequest('method', { a: 1 }, null, null);

      assert.throws(function () {
        request.send();
      });
    });
  });
});
