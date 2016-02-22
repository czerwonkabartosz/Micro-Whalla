# Express example
Example with Express. Expres app communicate with other service to get data.

```
npm install express
node service.js
node api.js
```

[http://localhost:3000/](http://localhost:3000/)

api.js
```javascript
var express = require('express');
var app = express();

var micro = require('../../index');
var Client = require('../../index').Client;
var service = new Client('service');

micro.init({ host: '192.168.99.100', port: 32768 });

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

```

service.js
```javascript
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

```