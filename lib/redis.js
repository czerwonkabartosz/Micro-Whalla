var redis = require('redis');

var _client = null;
var _events = null;
var _opts = {};

function createClient(opts) {
  return redis.createClient(opts);
}

function client() {
  return _client || createClient(_opts);
}

function events() {
  return _events || createClient(_opts);
}

function init(opts) {
  _opts = opts || {};
  _opts.prefix = opts.prefix || 'micro-whalla::';
}

module.exports = {
  init: init,
  createClient: createClient,
  client: client,
  events: events
};
