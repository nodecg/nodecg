'use strict';

var express = require('express');
var configHelper = require('../config');
var log = require('../logger')('nodecg/lib/dashboard');
var bundles = require('../bundles');
var favicon = require('express-favicon');
var path = require('path');
var fs = require('fs');
var ncgUtils = require('../util');
var jade = require('jade');

var app = express();
var filteredConfig = configHelper.getFilteredConfig();
var publicPath = path.join(__dirname, 'public');
var cachedDashboard = null;

log.trace('Adding Express routes');
app.use('/dashboard', express.static(publicPath));
app.use(favicon(publicPath + '/img/favicon.ico'));
app.set('views', publicPath);

app.get('/', function(req, res) {
    res.redirect('/dashboard/');
});

app.get('/dashboard', ncgUtils.authCheck, function(req, res) {
    if (filteredConfig.developer) {
        res.render(__dirname + '/src/dashboard.jade', {
            bundles: bundles.all(),
            ncgConfig: filteredConfig
        });
    } else {
        res.status(200).send(cachedDashboard);
    }
});

app.get('/panel/:bundle/:panel/', ncgUtils.authCheck, function(req, res, next) {
    // Check if the specified bundle exists
    var bundleName = req.params.bundle;
    var bundle = bundles.find(bundleName);
    if (!bundle) {
        next();
        return;
    }

    // Check if the specified panel exists within this bundle
    var panelName = req.params.panel;
    var panel = null;
    bundle.dashboard.panels.some(function(p) {
        if (p.name === panelName) {
            panel = p;
            return true;
        } else {
            return false;
        }
    });
    if (!panel) {
        next();
        return;
    }

    var fileLocation = path.join(bundle.dashboard.dir, panel.file);
    var html;
    if (panel.dialog) {
        html = ncgUtils.injectScripts(fileLocation, 'dialog', {createApiInstance: bundle});
    } else {
        html = ncgUtils.injectScripts(fileLocation, 'panel', {createApiInstance: bundle});
    }

    res.send(html);
});

app.get('/panel/:bundle/components/*', function(req, res, next) {
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

app.get('/panel/:bundle/*', ncgUtils.authCheck, function(req, res, next) {
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
bundles.on('bundleChanged', cacheDashboard);

module.exports = app;
