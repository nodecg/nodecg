'use strict';

var browserify = require('browserify');
var b = browserify();
var express = require('express');
var app = express();

b.add('./lib/api.js');

app.get('/nodecg-api.js', function(req, res) {
    b.bundle(function(err, buf) {
        if (err) {
            console.error(err.stack);
            res.sendStatus(500);
        } else {
            res.send(buf);
        }
    }).pipe(process.stdout);
});

module.exports = app;
