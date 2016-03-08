var redis = require('redis');

var _client = null;
var _pub = null;
var _sub = null;
var _opts = {};

function createClient(opts) {
  return redis.createClient(opts);
}

function client() {
  return _client || (_client = createClient(_opts));
}

function sub() {
  return _sub || (_sub = createClient(_opts));
}

function pub() {
  return _pub || (_pub = createClient(_opts));
}

function init(opts) {
  _opts = opts || {};
  _opts.prefix = opts.prefix || 'micro-whalla::';
}

module.exports = {
  init: init,
  createClient: createClient,
  client: client,
  sub: sub,
  pub: pub
};
