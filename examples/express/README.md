# Express example
Example with Express. Expres app communicate with other service to get data.

```
npm install express
node service.js
node api.js
```

[http://localhost:3000/](http://localhost:3000/)

api.js
```
var micro = require('../../index');
micro.init({host: '192.168.99.100', port: 32768});

var Client = require('../../index').Client;

var service = Client('service');

app.get('/', function (req, res) {
    service
        .request('getDate', {param: new Date()})
        .timeout(1000)
        .send()
        .on('success', function (result) {
            res.end(result);
        });
});

app.get('/error', function (req, res) {
    service
        .request('error')
        .send()
        .on('success', function (result) {
            res.end(result);
        })
        .on('error', function (result) {
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
        .request('getDate', {param: new Date()}, function (err, result) {
            res.end(result);
        })
        .send();
});
```

service.js
```
var micro = require('../../index');
micro.init({host: '192.168.99.100', port: 32768});

var Service = micro.Service;
var service = Service('service');

service.register('getDate', getDate);
service.register('error', error);

service.start();

function getDate(req, res) {
    var data = req.data;
    res.done('Today is ' + data.param);
}

function error(req, res) {
    res.error(new Error('Error in service'));
};
```