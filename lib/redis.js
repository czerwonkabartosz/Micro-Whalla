var redis = require('redis');

var _client = null;
var _pub = null;
var _sub = null;
var _opts = {};

function createClient(opts) {
  var c;

  opts.retry_strategy = function retry(options) {
    console.log(options);

    if (options.error.code === 'ECONNREFUSED') {
      console.log('[MICRO-WHALLA-REDIS] Connection refused');
    }

    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('[MICRO-WHALLA-REDIS] Retry time exhausted');
    }

    return Math.max(options.attempt * 100, 2000);
  };

  c = redis.createClient(opts);

  c.on('error', function error(err) {
    console.log('[MICRO-WHALLA-REDIS] Error - ' + JSON.stringify(err));
  });

  c.on('end', function error(err) {
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
