'use strict';

var express = require('express');
var app = express();

var options = {root: __dirname + '/public/'};
app.get('/nodecg-api.js', function(req, res) {
    res.sendFile('browserifiedApi.min.js', options);
});

app.get('/nodecg-api.map.json', function(req, res) {
    res.sendFile('browserifiedApi.map.json', options);
});

module.exports = app;
