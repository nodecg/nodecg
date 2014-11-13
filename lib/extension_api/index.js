'use strict';

var handlers = [];
var io = {};

function NodeCG(bundleName, ioInstance) {
    this.bundleName = bundleName;

    io = ioInstance;

    io.sockets.on('connection', function onConnection(socket) {
        socket.on('message', function onMessage(data, cb) {
            for (var i = 0; i < handlers.length; i++) {
                var handler = handlers[i];
                if (data.messageName === handler.messageName &&
                    data.bundleName === handler.bundleName) {
                    handler.func(data.content, cb);
                }
            }
        });
    });

    var config = {};
    Object.defineProperty( this, 'config', {
        value: require('../config'),
        writable: false,
        enumerable: true
    });
}

NodeCG.prototype.sendMessage = function (messageName, data, callback) {
    if (typeof callback === "undefined" && typeof data === "function") {
        callback = data;
        data = null;
    }

    io.sockets.json.send({
        bundleName: this.bundleName,
        messageName: messageName,
        content: data
    }, callback);
};

NodeCG.prototype.listenFor = function (messageName, bundleName, handler) {
    if (typeof handler === "undefined") {
        handler = bundleName;
        bundleName = this.bundleName;
    }

    handlers.push({
        messageName: messageName,
        bundleName: bundleName,
        func: handler
    });
};

NodeCG.prototype.createVar = function (name, value, setter) {
    if (typeof setter === "undefined") {
        if (typeof value === "function") {
            setter = value;
            value = null;
        } else {
            setter = function(){};
        }
    }
    
    var nodecg = this;

    this.listenFor(name, function(newValue) {
        nodecg.variables[name] = newValue;
    });

    Object.defineProperty(this.variables, name, {
        get: function() {
            return value;
        },
        set: function(newValue) {
            value = newValue;
            setter(newValue);
            nodecg.sendMessage(name, newValue);
        },
        enumerable: true
    });
};

// not implemented, need to make a way to delete listenFor handlers
/*NodeCG.prototype.deleteVar = function (name) {
    delete this.variables[name];
};*/

NodeCG.prototype.variables = {};

NodeCG.prototype.util = {};

NodeCG.prototype.util.authCheck = function (req, res, next) {
    if (!config.login.enabled) {
        return next();
    }

    var allowed = (req.user !== undefined) ? req.user.allowed : false;

    if (req.isAuthenticated() && allowed) {
        return next();
    }

    res.redirect('/login');
};

module.exports = NodeCG;
