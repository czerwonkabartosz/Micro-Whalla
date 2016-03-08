var Client = require('./client');
var Service = require('./service');
var Method = require('./method');
var redis = require('./redis');

function init(opts) {
  redis.init(opts);
}

module.exports = {
  Client: Client,
  Service: Service,
  Method: Method,
  redis: redis,
  init: init
};
