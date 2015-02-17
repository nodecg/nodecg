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
    fs = require('fs'),
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

app.get('/dashboard/:bundle/components/*', function(req, res, next) {
    var bundleName = req.params.bundle;

    var bundle = Bundles.find(bundleName);

    if (!bundle) {
        next();
        return;
    }

    var resName = req.params[0];

    var fileLocation = path.join(bundle.dir, 'bower_components', resName);

    // Check if the file exists
    if (!fs.existsSync(fileLocation)) {
        next();
        return;
    }

    res.sendFile(fileLocation);
});

app.get('/dashboard/:bundle/*', utils.authCheck, function(req, res, next) {
    var bundle = Bundles.find(req.params.bundle);

    if (!bundle || req.params[0] == 'panels.json') {
        next();
        return;
    }

    var resName = req.params[0];

    var fileLocation = path.join(bundle.dashboard.dir, resName);

    // Check if the file exists
    if (!fs.existsSync(fileLocation)) {
        next();
        return;
    }

    res.sendFile(fileLocation);
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.use(clientIncludes);

module.exports = app;
