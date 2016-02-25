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
    it('should create object with data', function () {
      var callback = function () {
        return 1;
      };
      var request = makeRequest('method', { a: 1 }, callback);
      assert.equal(request.method, 'method');
      assert.equal(request.data.a, 1);
      assert.equal(request.callback, callback);
    });
  });
  describe('Function: fireAndForget', function () {
    it('should set fireAndForget option to true', function () {
      var request = makeRequest('method', { a: 1 });
      request.fireAndForget();
      assert.equal(request.options.fireAndForget, true);
    });
  });
  describe('Function: timeout', function () {
    it('should set timeout option with value', function () {
      var request = makeRequest('method', { a: 1 });
      request.timeout(50);
      assert.equal(request.options.timeout, 50);
    });
    it('should throw error if put incorrect value', function () {
      var request = makeRequest('method', { a: 1 });
      assert.throws(function () {
        request.timeout(-1);
      });
    });
  });
  describe('Function: isExpired', function () {
    it('should return false if not sent', function () {
      var request = makeRequest('method', { a: 1 });
      assert.isFalse(request.isExpired());
    });
    it('should return false if not set timeout', function () {
      var request = makeRequest('method', { a: 1 });
      request.send();
      assert.isFalse(request.isExpired());
    });
    it('should return false if fire and forget', function () {
      var request = makeRequest('method', { a: 1 });
      request.timeout(1000);
      request.fireAndForget();
      request.send();
      assert.isFalse(request.isExpired());
    });
    it('should return false if time not elapsed', function (done) {
      var request = makeRequest('method', { a: 1 });
      request.timeout(50);
      request.send();
      request.stopTimeout();

      setTimeout(function () {
        assert.isFalse(request.isExpired());
        done();
      }, 40);
    });
    it('should return true  if time elapsed', function (done) {
      var request = makeRequest('method', { a: 1 });
      request.timeout(50);
      request.send();
      request.stopTimeout();

      setTimeout(function () {
        assert.isTrue(request.isExpired());
        done();
      }, 50);
    });
  });
  describe('Function: send', function () {
    it('should call send on client', function () {
      var request = makeRequest('method', { a: 1 });

      request.send();
      assert(clientMock.send.calledOnce);
    });
    it('should call startTimeout', function () {
      var request = makeRequest('method', { a: 1 });
      request.startTimeout = sinon.spy();

      request.send();
      assert(request.startTimeout.calledOnce);
    });
    it('should call addRequest if not set fireAndForget', function () {
      var request = makeRequest('method', { a: 1 });

      request.send();
      assert(clientMock.addRequest.calledOnce);
    });
    it('should not call startTimeout if set fireAndForget', function () {
      var request = makeRequest('method', { a: 1 });
      request.startTimeout = sinon.spy();

      request.fireAndForget();
      request.send();
      assert(request.startTimeout.notCalled);
    });
    it('should not call addRequest if set fireAndForget', function () {
      var request = makeRequest('method', { a: 1 });

      request.fireAndForget();
      request.send();
      assert(clientMock.addRequest.notCalled);
    });
    it('should trow error if not set client', function () {
      var request = makeRequest('method', { a: 1 }, null, null);

      assert.throws(function () {
        request.send();
      });
    });
  });
  describe('Function: toJSON', function () {
    it('should return json with data from object', function () {
      var clientId = 1;
      var request = makeRequest('method', { a: 1 });
      var json = request.toJSON(clientId);
      var requestFromJson = JSON.parse(json);
      assert.equal(requestFromJson.id, request.id);
      assert.equal(requestFromJson.method, request.method);
      assert.equal(requestFromJson.data.a, request.data.a);
      assert.equal(requestFromJson.clientId, clientId);
    });
  });
  describe('Function: fromJson', function () {
    it('should return object with data from json', function () {
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
  describe('Function: startTimeout', function () {
    it('should create timeout if is set timeout option', function () {
      var request = makeRequest('method', { a: 1 });
      request.timeout(50);
      request.startTimeout();
      assert.isNotNull(request.timeoutHandler);
    });
    it('should not create timeout if is not set timeout option', function () {
      var request = makeRequest('method', { a: 1 });
      request.startTimeout();
      assert.isFalse(!!request.timeoutHandler);
    });
    it('should create timeout with function to emit failed status after timeout', function (done) {
      var startTime;
      var request = makeRequest('method', { a: 1 });
      request.timeout(50);
      startTime = new Date();
      request.startTimeout();
      request.on('failed', function (error) {
        assert.isNotNull(error);
        assert(startTime.getTime() + request.options.timeout <= new Date().getTime());
        done();
      });
    });
    it('should create timeout with function to call callback after timeout', function (done) {
      var request;
      var startTime;
      var callback = function (err) {
        assert.isNotNull(err);
        assert(startTime.getTime() + request.options.timeout <= new Date().getTime());
        done();
      };
      request = makeRequest('method', { a: 1 }, callback);
      request.timeout(50);
      request.startTimeout();
      startTime = new Date();
    });
  });
  describe('Function: stopTimeout', function () {
    it('should set null in timeoutHandler', function () {
      var request = makeRequest('method', { a: 1 });
      request.timeout(50);
      request.startTimeout();
      assert.isNotNull(request.timeoutHandler);
      request.stopTimeout();
      assert.isNull(request.timeoutHandler);
    });
  });
});
