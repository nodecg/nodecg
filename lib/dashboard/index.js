'use strict';

var express = require('express'),
    app = express(),
    configHelper = require('../config'),
    filteredConfig = configHelper.getFilteredConfig(),
    expressLess = require('express-less'),
    log = require('../logger')('nodecg/lib/dashboard'),
    Bundles = require('../bundles'),
    clientIncludes = require('../client_includes'),
    utils = require('../util');

log.trace('Adding Express routes');
app.use('/dashboard', express.static(__dirname + '/public'));
app.use('/dashboard', expressLess(__dirname + '/public', { compress: true }));
app.set('views', __dirname);

app.get('/', function(req, res) {
    res.redirect('/dashboard/');
});

app.get('/dashboard', utils.authCheck, function(req, res) {
    res.render('public/dashboard.jade', {bundles: Bundles.all(), ncgConfig: filteredConfig});
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.use(clientIncludes);

module.exports = app;
