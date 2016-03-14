# Micro Whalla 
[![npm version](https://badge.fury.io/js/micro-whalla.svg)](https://badge.fury.io/js/micro-whalla)
[![Build Status](https://travis-ci.org/czerwonkabartosz/Micro-Whalla.svg?branch=master)](https://travis-ci.org/czerwonkabartosz/Micro-Whalla) 
[![Coverage Status](https://coveralls.io/repos/github/czerwonkabartosz/Micro-Whalla/badge.svg?branch=master)](https://coveralls.io/github/czerwonkabartosz/Micro-Whalla?branch=master)
[![Dependency Status](https://david-dm.org/czerwonkabartosz/Micro-Whalla.svg)](https://david-dm.org/czerwonkabartosz/Micro-Whalla)
[![Gitter](https://badges.gitter.im/czerwonkabartosz/Micro-Whalla.svg)](https://gitter.im/czerwonkabartosz/Micro-Whalla?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

A simple, fast framework for writing microservices in Node.js communicate using RPC / IPC.
It uses Redis server for communicate clients and services, it is making it fast, stable and easily scaling.
It can be used for interprocess communication, or for communication between servers.

```javascript
var micro = require('micro-whalla');
var Client = micro.Client;
var client = new Client('example-service');

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

```javascript
var util = require('util');
var micro = require('micro-whalla');
var Service = micro.Service;
var service;

function ExampleService() {
  this.repository = function () {
      return [1, 2, 3];
    };

  Service.call(this, 'example-service');
}

util.inherits(ExampleService, Service);

service = new ExampleService();

service.register('method', function (req, res) {
    res.done(this.repository());
});

service.register('method2', function (req, res) {
  res.progress(50);
  setTimeout(function () {
    res.done(req.data);
  }, 300);
});

service.start();

```

## Features
- Focus on high performance
- Concurrent processing
- Design based on Redis
- Many methods in the service
- Interprocess communication (IPC)
- Servers communication (RPC)
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

# API Reference

## Initialization
Used to configuration for redis. 
This function should only be called once at the beginning of the application.
```javascript
var micro = require('micro-whalla');
micro.init({ host: '192.168.99.100', port: 32768 });
```
The ```opts``` fields are:
- ```host```: string, Redis host.
- ```port```: number, Redis port.
- ```db```: number, Redis DB index.

## Client
### Client(serviceName, opts)
It creates a new Client dedicated for communicate with other Service.

```javascript
var Client = require('micro-whalla').Client;
var client = new Client('service');
```

### Client.prototype.request(method, data, callback)

Used to create new request to other service. This function return new ```Request```.
```javascript
var request = client.request('method', { param: new Date() });
```

- ```method``` - [required] name method which be executed
- ```data``` - [required] params and data for method which be executed
- ```callback``` - [optional]  callback of request - executed when client received succeed or failed status


## Service
### Service(serviceName, opts)
It creates a new Service.

```javascript
var Service = require('micro-whalla').Service;
var service = new Service('service', {});
```

The ```opts``` fields are:
- ```concurrency``` - (optional) maximum number of simultaneously active jobs for this processor. It defaults to 1

### Service.prototype.register(name, handler(req, res))

Used to register method in service before start service.

```javascript
service.register('method', function (req, res) {
  res.done(req.data);
});
```

The name of handler should be unique.

The handler function should:
- call ```res.done(result)``` or ```res.error(error)```
- not block event loop for very long time

The handler function is called with ```Request``` and ```Response```params. 
 
### Service.prototype.start()
Used to start service.

### Service.prototype.findAndRegisterMethods(pattern)
Used to find all methods in folders and register them in the service.

- ```pattern``` - [optional] pattern used to find methods. It defaults to ```/methods/**/*.method.js```

All files should exports Method.

```javascript
var Method = require('micro-whalla').Method;

function getUser(req, res) {
  var self = this;
  var userId = req.data.userId;

  self.usersRepository.findUserById(userId, function (err, user) {
    if (err) {
      return res.error(err);
    }

    return res.done(user);
  });
}

module.exports = new Method('getUser', getUser);

```

## Request

- ```id``` - number, unique id 
- ```method``` - string, name of method in remote service
- ```data``` - object, data / params for method
- ```options``` - object, used by framework
- ```sent``` - date, sent date

### Request.prototype.timeout(timeout)

Sets a reqeust timeout. After the time has elapsed without a response is returned error.

```javascript
var request = client.request('method', { param: new Date() }).timeout(1000);
```

### Request.prototype.cache(time)

Sets a reqeust cache time. During this time result is returned from the cache.

```javascript
var request = client.request('method', { param: new Date() }).cache(1000);
```

### Request.prototype.fireAndForget()

Indication that are not expected to result from the request.

```javascript
var request = client.request('method', { param: new Date() }).fireAndForget();
```

### Request.prototype.send(callback)

Send request to service.

```javascript
var request = client.request('method', { param: new Date() }).send();
```

### Request.on(event, listener)

Set listeners for callback events.
Default events:
- succeeded
- failed
- info
- progress

```javascript
var request = client.request('method', { param: new Date() })
  .on('succeeded', function (result) {
    console.log(result);
  })
  .on('failed', function (error) {
    console.log(error);
  }).send();
```



## Response

### Response.prototype.done(result)

Ends the process and returns result for the client.


```javascript
 res.done({date: new Date()});
```

**Event: ```succeeded```**

### Response.prototype.error(error)

Ends the process and returns error for the client.

```javascript
 res.error(new Error(''));
```

**Event: ```failed```**

### Response.prototype.info(data)

Sends information to client with data.

```javascript
res.info({ information: '' });
```

**Event: ```info```**

### Response.prototype.progress(progress)

Sends progress information to client with progress value.

```javascript
res.progress(50);
```

**Event: ```progress```**

### Response.prototype.event(name, data, err)

Sends any custom events to client.

```javascript
res.event('custom', { data: 1 });
```


# License
[MIT](LICENSE)
