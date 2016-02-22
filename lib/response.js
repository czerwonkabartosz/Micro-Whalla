function Response(request, service, endCallback) {
    this.id = request.id;
    this.clientId = request.clientId;
    this.request = request;

    this._service = service;
    this._fnishProcessCallback = endCallback;
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
    return this.event('progress', progress)
};

Response.prototype.end = function (err, result) {
    this.event(err ? 'error' : 'success', result, err);
    this._fnishProcessCallback();

    return this;
};

Response.prototype.event = function (name, data, err) {
    if (this.request.options.fireAndForget) {
        return;
    }

    var event = {
        id: this.id,
        status: name,
        data: data
    };

    if (err) {
        event.error = err.message;
    }

    this._service.sendEvent(this.clientId, event);

    return this;
};

module.exports = Response;
