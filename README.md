# Micro Whalla

A lightweight framework / module to write microservices with Node.js and Redis server. 

```
var micro = require('micro-whalla');

var Service = micro.Service;
var service = Service('example-service');

service.register('method', function (req, res) {
    res.done(req.data);
});

service.start();



var Client = micro.Client;
var client = Client('example-service');

client
    .request('getDate', {param: new Date()})
    .timeout(1000)
    .send()
    .on('success', function (result) {
        console.log(result);
    })
    .on('error', function (error) {
        console.error(result);
    });
```