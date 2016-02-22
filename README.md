# Micro Whalla 
[![Build Status](https://travis-ci.org/czerwonkabartosz/Micro-Whalla.svg?branch=master)](https://travis-ci.org/czerwonkabartosz/Micro-Whalla) [![Coverage Status](https://coveralls.io/repos/github/czerwonkabartosz/Micro-Whalla/badge.svg?branch=master)](https://coveralls.io/github/czerwonkabartosz/Micro-Whalla?branch=master)

A lightweight framework / module to write microservices with Node.js and Redis server. 

```javascript
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
    .request('method', {param: new Date()})
    .timeout(1000)
    .send()
    .on('succeeded', function (result) {
        console.log(result);
    })
    .on('failed', function (error) {
        console.error(result);
    });
```
