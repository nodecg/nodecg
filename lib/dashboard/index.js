'use strict';

var express = require('express'),
    app = express(),
    configHelper = require('../config'),
    filteredConfig = configHelper.getFilteredConfig(),
    expressLess = require('express-less'),
    log = require('../logger')('nodecg/lib/dashboard'),
    Bundles = require('../bundles'),
    clientIncludes = require('../client_includes'),
    favicon = require('express-favicon'),
    path = require('path'),
    utils = require('../util');

log.trace('Adding Express routes');
var publicPath = path.join(__dirname, 'public');
app.use('/dashboard', express.static(publicPath));
app.use('/dashboard', expressLess(publicPath, { compress: true }));
app.set('views', publicPath);

app.use(favicon(publicPath + '/img/favicon.ico'));

app.get('/', function(req, res) {
    res.redirect('/dashboard/');
});

app.get('/dashboard', utils.authCheck, function(req, res) {
    res.render('dashboard.jade', {bundles: Bundles.all(), ncgConfig: filteredConfig});
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.use(clientIncludes);

module.exports = app;
