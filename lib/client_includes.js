'use strict';

var browserify = require('browserify');
var b = browserify({ debug: true });
var express = require('express');
var app = express();

var browserifiedBuf;
b.add('./lib/api.js');
b.ignore('./lib/server/index.js');
b.ignore('./lib/replicator.js');
b.ignore('./lib/util.js');
b.transform('aliasify', {
    aliases: {
        './logger': './browser/logger'
    },
    verbose: true
});
b.transform('brfs');
b.bundle(function(err, buf) {
    if (err) {
        console.error(err.stack);
        res.sendStatus(500);
    } else {
        browserifiedBuf = buf;
    }
});

app.get('/nodecg-api.js', function(req, res) {
    res.send(browserifiedBuf);
});

module.exports = app;
