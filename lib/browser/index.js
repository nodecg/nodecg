'use strict';

var express = require('express');
var app = express();

var options = {root: __dirname + '/dist/'};

if (process.env.test) {
    app.get('/nodecg-api.js', function(req, res) {
        res.sendFile('browserifiedTestApi.js', options);
    });
} else {
    app.get('/nodecg-api.js', function(req, res) {
        res.sendFile('browserifiedApi.min.js', options);
    });

    app.get('/nodecg-api.map.json', function(req, res) {
        res.sendFile('browserifiedApi.map.json', options);
    });
}

app.use('/shims', express.static('./lib/browser/shims', {maxAge: 60*60*24*7*1000}));

module.exports = app;
