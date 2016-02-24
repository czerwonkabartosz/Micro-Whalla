var micro = require('../../index');
var Service = micro.Service;
var service;

micro.init({ host: '192.168.99.100', port: 32768 });
service = new Service('service');

function getDate(req, res) {
  var data = req.data;
  res.done('Today is ' + data.param);
}

function error(req, res) {
  res.error(new Error('Error in service'));
}

service.register('getDate', getDate);
service.register('error', error);

service.start();
