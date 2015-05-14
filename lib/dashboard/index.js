'use strict';

var express = require('express');
var configHelper = require('../config');
var log = require('../logger')('nodecg/lib/dashboard');
var bundles = require('../bundles');
var clientIncludes = require('../client_includes');
var favicon = require('express-favicon');
var path = require('path');
var fs = require('fs');
var utils = require('../util');
var jade = require('jade');

var app = express();
var filteredConfig = configHelper.getFilteredConfig();
var publicPath = path.join(__dirname, 'public');
var cachedDashboard = null;

log.trace('Adding Express routes');
app
    .use('/dashboard', express.static(publicPath))
    .use(favicon(publicPath + '/img/favicon.ico'))
    .use(clientIncludes);
app.set('views', publicPath);

app.get('/', function(req, res) {
    res.redirect('/dashboard/');
});

app.get('/dashboard', utils.authCheck, function(req, res) {
    res.status(200).send(cachedDashboard);
});

// Polymer fails catastrophically when more than one copy is loaded, so don't allow that
app.get('/dashboard/:bundle/components/polymer/*', function(req, res, next) {
    res.sendStatus(204);
});

app.get('/dashboard/:bundle/components/*', function(req, res, next) {
    var bundleName = req.params.bundle;
    var bundle = bundles.find(bundleName);
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

app.get('/dashboard/:bundle/*', function(req, res, next) {
    var bundleName = req.params.bundle;
    var bundle = bundles.find(bundleName);
    if (!bundle) {
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

function cacheDashboard() {
    cachedDashboard = jade.renderFile(__dirname + '/src/dashboard.jade', {
        bundles: bundles.all(),
        ncgConfig: filteredConfig
    });
}

// When all bundles are first loaded, render and cache the dashboard
bundles.on('allLoaded', cacheDashboard);

// When a panel is re-parsed, re-render and cache the dashboard
bundles.on('panelsChanged', cacheDashboard);

module.exports = app;
