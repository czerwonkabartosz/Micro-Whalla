var util = require('util');
var micro = require('../../index');
var Service = micro.Service;
var service;

micro.init({ host: 'redis-16132.c8.us-east-1-3.ec2.cloud.redislabs.com', port: 16132 });

function ExampleService() {
  this.repository = function () {
    return [1, 2, 3];
  };

  Service.call(this, 'example-service');

  this.findAndRegisterMethods();
}

function error(req, res) {
  res.error(new Error('Error in service'));
}

util.inherits(ExampleService, Service);

service = new ExampleService();

service.register('error', error);

service.start();
