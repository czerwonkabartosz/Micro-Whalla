function Response(request, service, endCallback) {
  var self = this;
  this.id = request.id;
  this.clientId = request.clientId;
  this.request = request;

  this._service = service;
  this._finishProcessCallback = endCallback;
  this._requestTimeout = setTimeout(self._timeout.bind(self), request.options.timeout || 1000);
}

Response.prototype.done = function (result) {
  return this.end(null, result);
};

Response.prototype.error = function (err) {
  return this.end(err, null);
};

Response.prototype.info = function (data) {
  return this.event('info', data);
};

Response.prototype.progress = function (progress) {
  return this.event('progress', progress);
};

Response.prototype.end = function (err, result) {
  clearTimeout(this._requestTimeout);
  this.event(err ? 'failed' : 'succeeded', result, err);
  this._finishProcessCallback();

  return this;
};

Response.prototype._timeout = function () {
  this.event('failed', null, new Error('Request timeout'));
  this._finishProcessCallback();

  return this;
};

Response.prototype.event = function (name, data, err) {
  var event;

  if (this.request.options.fireAndForget) {
    return this;
  }

  event = {
    id: this.id,
    status: name,
    data: data
  };

  if (err && err instanceof Error) {
    event.error = err.message;
  } else {
    event.error = err;
  }

  if (this._service && this._service.sendEvent) {
    this._service.sendEvent(this.clientId, event);
  }

  return this;
};

module.exports = Response;
