var express = require('express');
var app = express();

var micro = require('../../index');
var Client = require('../../index').Client;
var service;

micro.init({ host: '192.168.99.100', port: 32768 });
service = new Client('service');

app.get('/', function (req, res) {
  service
    .request('getDate', { param: new Date() })
    .timeout(1000)
    .send()
    .on('succeeded', function (result) {
      res.end(result);
    });
});

app.get('/error', function (req, res) {
  service
    .request('failed')
    .send()
    .on('succeeded', function (result) {
      res.end(result);
    })
    .on('failed', function (result) {
      res.end(result);
    });
});

app.get('/fire', function (req, res) {
  service
    .request('error')
    .fireAndForget()
    .send();

  res.end();
});

app.get('/cb', function (req, res) {
  service
    .request('getDate', { param: new Date() }, function (err, result) {
      res.end(result);
    })
    .send();
});

app.listen(3000);
