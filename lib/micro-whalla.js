var Client = require('./client');
var Service = require('./service');
var redis = require('./redis');

function init(opts) {
    redis.init(opts);
}

module.exports = {
    Client: Client,
    Service: Service,
    redis: redis,
    init: init
};