'use strict';

var browserify = require('browserify');
var b = browserify({ debug: true });
var express = require('express');
var app = express();

b.add('./lib/api.js');
b.add('./lib/config.js');
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

app.get('/nodecg-api.js', function(req, res) {
    b.bundle(function(err, buf) {
        if (err) {
            console.error(err.stack);
            res.sendStatus(500);
        } else {
            res.send(buf);
        }
    });
});

module.exports = app;
