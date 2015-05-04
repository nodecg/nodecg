'use strict';

var browserify = require('browserify');
var b = browserify({ debug: true });
var express = require('express');
var fs = require('fs');
var app = express();
var Q = require('q');

// BRFS throws an error during transformation when attempting to fs.readFileSync a non-existant file
// For this reason, we ensure that nodecg.json exists
if (!fs.existsSync('cfg/nodecg.json')) {
    fs.writeFileSync('cfg/nodecg.json', '{}');
}

var browserifiedBuf;
b.add('./lib/api.js');
b.ignore('./lib/server/index.js');
b.ignore('./lib/replicator.js');
b.ignore('./lib/util.js');
b.transform('aliasify', {
    aliases: {
        './logger': './browser/logger',
        './replicant': './browser/replicant'
    },
    verbose: false
});
b.transform('brfs');

var deferred = Q.defer();
b.bundle(function(err, buf) {
    if (err) {
        console.error(err.stack);
        deferred.reject();
    } else {
        browserifiedBuf = buf;
        deferred.resolve();
    }
});
var promise = deferred.promise;

app.get('/nodecg-api.js', function(req, res) {
    if (browserifiedBuf) {
        res.send(browserifiedBuf);
    } else {
        promise.then(function() {
            res.send(browserifiedBuf);
        });
    }
});

module.exports = app;
