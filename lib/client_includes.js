'use strict';

var browserify = require('browserify');
var b = browserify({ debug: true });
var express = require('express');
var app = express();

b.add('./browser/logger.js');
b.add('./lib/api.js');
b.transform('brfs');
b.ignore('./lib/logger.js');
b.ignore('./lib/server/index.js');
b.ignore('./lib/replicator.js');
b.ignore('./lib/util.js');

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
