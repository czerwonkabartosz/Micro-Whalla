var chai = require('chai');
var assert = chai.assert;

var Method = require('../lib/method');

describe('Method', function () {
  describe('Constructor', function () {
    it('should create method with name', function () {
      var method = new Method('test');
      assert.equal(method.name, 'test');
    });
    it('should create method with function', function () {
      var func = function () {
        return 1;
      };
      var method = new Method('test', func);
      assert.equal(method.method, func);
    });
  });
});
