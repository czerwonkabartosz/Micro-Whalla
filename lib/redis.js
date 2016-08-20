var _ = require('lodash');
var redis = require('redis');
var RedisSMQ = require('rsmq');

var _client = null;
var _pub = null;
var _sub = null;
var _rsmq = null;
var _opts = {};

function createClient(opts) {
  var c = redis.createClient(opts);

  c.on('error', function error(err) {
    console.log('[MICRO-WHALLA-REDIS] Error - ' + JSON.stringify(err));
  });

  c.on('end', function error() {
    console.log('[MICRO-WHALLA-REDIS] End');
  });

  c.on('reconnecting', function reconnecting() {
    console.log('[MICRO-WHALLA-REDIS] Connection reestablished');
  });

  c.on('connect', function connect() {
    console.log('[MICRO-WHALLA-REDIS] Connecting');
  });

  c.on('ready', function ready() {
    console.log('[MICRO-WHALLA-REDIS] Ready');
  });

  return c;
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
  _opts = _.assignIn({}, opts);
  _opts.prefix = opts.prefix || 'micro-whalla::';
}

function queue() {
  var options = _.assignIn({}, _opts);
  options.ns = options.delete;
  delete options.prefix;

  return _rsmq || (_rsmq = new RedisSMQ(options));
}

module.exports = {
  init: init,
  createClient: createClient,
  client: client,
  sub: sub,
  pub: pub,
  queue: queue
};