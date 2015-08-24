'use strict';

// Libs
var fs = require('fs');
var path = require('path');
var app = require('express')();
var io = require('../../server').getIO();
var bundles = require('../../bundles');
var injectScripts = require('../../util').injectScripts;

// Constants
var HEARTBEAT_INTERVAL = 1000;

// Vars
var liveSocketIds = {};
var heartbeatTimeouts = {};

// Figure out which urls we need to enforce single instance behavior on.
bundles.all().forEach(function(bundle) {
    bundle.graphics.forEach(function(graphic) {
        if (!graphic.singleInstance) return;
        liveSocketIds[graphic.url] = null;
    });
});

io.on('connection', function (socket) {
    socket.on('graphicHeartbeat', function (url, cb) {
        // If the supplied url isn't for any of the urls that we're expecting, do nothing.
        if (!liveSocketIds.hasOwnProperty(url)) return;

        /* If we have a live socket id...
         *     and this is the live socket, reset the heartbeatTimeout and invoke callback with "true".
         *     Else, invoke callback with "false".
         * Else, this socket becomes the live socket. */
        if (liveSocketIds[url]) {
            if (socket.id === liveSocketIds[url]) {
                clearTimeout(heartbeatTimeouts[url]);
                heartbeatTimeouts[url] = setTimeout(function() {
                    liveSocketIds[url] = null;
                }, HEARTBEAT_INTERVAL * 2);
                cb(true);
            } else {
                cb(false);
            }
        } else {
            liveSocketIds[url] = socket.id;
            app.emit('graphicOccupied', url);
        }
    });

    socket.on('isGraphicAvailable', function (url, cb) {
        cb(!liveSocketIds[url]);
    });

    socket.on('disconnect', function () {
        // If the socket that disconnected is one of our live sockets, immediately clear it.
        for (var url in liveSocketIds) {
            if (liveSocketIds.hasOwnProperty(url)) {
                if (socket.id === liveSocketIds[url]) {
                    clearTimeout(heartbeatTimeouts[url]);
                    liveSocketIds[url] = null;
                    app.emit('graphicAvailable', url);
                    break;
                }
            }
        }
    });
});

app.get('/instance/*', function(req, res, next) {
    var resName = req.path.split('/').slice(2).join('/');
    var fileLocation = path.resolve(__dirname, 'public/', resName);

    // Check if the file exists
    if (!fs.existsSync(fileLocation)) {
        next();
        return;
    }

    // If it's a HTML file, inject the graphic setup script and serve that
    // otherwise, send the file unmodified
    if (resName.endsWith('.html')) {
        var html = injectScripts(fileLocation, 'graphic');
        res.send(html);
    } else {
        res.sendFile(fileLocation);
    }
});

module.exports = app;
module.exports.liveSocketIds = liveSocketIds;
