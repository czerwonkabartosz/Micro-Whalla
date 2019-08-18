var _ = require('lodash');
var redis = require('redis');

var _client = null;
var _pub = null;
var _sub = null;
var _opts = {};
var debug = require('debug')('micro-whalla:redis');

function createClient(opts) {
  // console.log('redis create client', opts);
  var c = redis.createClient(opts);

  c.on('error', function error(err) {
    debug('Error - ' + JSON.stringify(err));
  });

  c.on('end', function error() {
    debug('End');
  });

  c.on('reconnecting', function reconnecting() {
    debug('Connection reestablished');
  });

  c.on('connect', function connect() {
    debug('Connecting');
  });

  c.on('ready', function ready() {
    debug('Ready');
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

module.exports = {
  init: init,
  createClient: createClient,
  client: client,
  sub: sub,
  pub: pub
};
