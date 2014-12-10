'use strict';

var express = require('express'),
    app = express(),
    configs = require('../config'),
    config = configs.config,
    filteredConfig = configs.filteredConfig,
    expressLess = require('express-less'),
    log = require('../logger'),
    Bundles = require('../bundles'),
    clientIncludes = require('../client_includes'),
    utils = require('../util');

log.trace('[lib/dashboard/index.js] Adding Express routes');
app.use('/dashboard', express.static(__dirname + '/public'));
app.use('/dashboard', expressLess(__dirname + '/public', { compress: true }));
app.set('views', __dirname);

app.get('/', function(req, res) {
    res.redirect('/dashboard');
});

app.get('/dashboard', utils.authCheck, function(req, res) {
    Bundles.all()
        .then(function (bundles) {
            res.render('public/dashboard.jade', {bundles: bundles, ncgConfig: filteredConfig});
        }, function (reason) {
            log.error('[lib/dashboard/index.js] Failed to load dashboard: %s', reason);
        });
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.use(clientIncludes);

module.exports = app;
