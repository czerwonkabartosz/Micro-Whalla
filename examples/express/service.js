var micro = require('../../index');
var Service = micro.Service;
var service = new Service('service');

micro.init({ host: '192.168.99.100', port: 32768 });

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
