var chai = require('chai');
var assert = chai.assert;
var sinon = require('sinon');

var Request = require('./../lib/request');
var Response = require('./../lib/response');

describe('Response', function () {
  describe('Constructor', function () {
    it('creates a response', function () {
      var request;
      var response;
      var callback = sinon.spy();
      var service = {};
      request = new Request('method', { a: 1 });
      request.clientId = 1;
      response = new Response(request, service, callback);

      assert.equal(response.id, request.id);
      assert.equal(response.clientId, 1);
      assert.equal(response.request, request);
      assert.equal(response._finishProcessCallback, callback);
    });
  });
  describe('Methods', function () {
    var args;
    var response;
    var finishProcessCallback;
    var service;
    var makeResponse = function (fcb) {
      var request = new Request('method', { a: 1 });
      request.clientId = 1;
      return new Response(request, service, fcb);
    };
    beforeEach(function () {
      args = null;
      service = { sendEvent: sinon.spy() };
      finishProcessCallback = sinon.spy();
      response = makeResponse(finishProcessCallback);
    });
    it('done', function () {
      response.done('OK');

      assert(finishProcessCallback.calledOnce);
      args = service.sendEvent.getCall(0).args;
      assert.equal(args[0], 1);
      assert.equal(args[1].id, response.id);
      assert.equal(args[1].status, 'succeeded');
      assert.equal(args[1].data, 'OK');
    });
    it('error', function () {
      response.error(new Error('Error'));

      assert(finishProcessCallback.calledOnce);
      args = service.sendEvent.getCall(0).args;
      assert.equal(args[0], 1);
      assert.equal(args[1].id, response.id);
      assert.equal(args[1].status, 'failed');
      assert.equal(args[1].error, 'Error');
    });
    it('info', function () {
      response.info({ step: 1 });

      assert(finishProcessCallback.notCalled);
      args = service.sendEvent.getCall(0).args;
      assert.equal(args[0], 1);
      assert.equal(args[1].id, response.id);
      assert.equal(args[1].status, 'info');
      assert.equal(args[1].data.step, 1);
    });
    it('progress', function () {
      response.progress(50);

      assert(finishProcessCallback.notCalled);
      args = service.sendEvent.getCall(0).args;
      assert.equal(args[0], 1);
      assert.equal(args[1].id, response.id);
      assert.equal(args[1].status, 'progress');
      assert.equal(args[1].data, 50);
    });
  });
  describe('Events', function () {
    it('not send events if request is fire and forget', function () {
      var request;
      var response;
      var finishProcessCallback = sinon.spy();
      var service = {
        sendEvent: sinon.spy()
      };
      request = new Request('method', { a: 1 });
      request.clientId = 1;
      request.fireAndForget();
      response = new Response(request, service, finishProcessCallback);

      response.event('test', {});

      assert(finishProcessCallback.notCalled);
      assert(service.sendEvent.notCalled);
    });
  });
});
