# Micro Whalla 
[![Build Status](https://travis-ci.org/czerwonkabartosz/Micro-Whalla.svg?branch=master)](https://travis-ci.org/czerwonkabartosz/Micro-Whalla) 
[![Coverage Status](https://coveralls.io/repos/github/czerwonkabartosz/Micro-Whalla/badge.svg?branch=master)](https://coveralls.io/github/czerwonkabartosz/Micro-Whalla?branch=master)
[![Dependency Status](https://david-dm.org/czerwonkabartosz/Micro-Whalla.svg)](https://david-dm.org/czerwonkabartosz/Micro-Whalla)

A simple, fast framework for writing microservices in Node.js communicate using RPC.
It uses Redis server for communicate clients and services, it is making it fast, stable and easily scaling.

```javascript
var micro = require('micro-whalla');
var Service = micro.Service;
var service = Service('example-service');

service.register('method', function (req, res) {
    res.done(req.data);
});

service.register('method2', function (req, res) {
  res.progress(50);
  setTimeout(function () {
    res.done(req.data);
  }, 300);
});

service.start();
```

```javascript
var micro = require('micro-whalla');
var Client = micro.Client;
var client = Client('example-service');

client
    .request('method2', {param: new Date()})
    .timeout(1000)
    .send()
    .on('succeeded', function (result) {
        console.log(result);
    })
    .on('progress', function (progress) {
        console.log(result);
    })
    .on('failed', function (error) {
        console.error(result);
    });
```

## Features
- Focus on high performance
- Concurrent processing
- Design based on Redis
- Many methods in the service
- Request timeouts
- Fire And Forget
- Processing callback events
- 100% code coverage

## Installation

```javascript
npm install micro-whalla
```

## Tests
To run tests, first install the dependencies, then run ```gulp test```
```javascript
npm install
gulp test
```

# Reference

## Client

## Service

## Request

## Response



# License
[MIT](LICENSE)
