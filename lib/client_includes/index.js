'use strict';

var express = require('express'),
    app = express();

app.get('/nodecg-api.js', function(req, res) {
    res.sendFile(__dirname + '/nodecg-api.js');
});

module.exports = app;