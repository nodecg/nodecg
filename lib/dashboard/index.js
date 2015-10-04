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
app.use('/dashboard', express.static(publicPath, {maxAge: 60*60*24*7*1000}));
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

bundles.all().forEach(function(bundle) {
    // Setup panel paths
    bundle.dashboard.panels.forEach(function(panel) {
        if (panel.dialog) {
            app.get('/panel/'+bundle.name+'/'+panel.name,
                ncgUtils.authCheck,
                function(req, res) {
                    ncgUtils.injectScripts(panel.html, 'dialog', {createApiInstance: bundle}, function(html) {
                        res.send(html);
                    });
                });
        } else {
            app.get('/panel/'+bundle.name+'/'+panel.name,
                ncgUtils.authCheck,
                function(req, res) {
                    ncgUtils.injectScripts(panel.html, 'panel', {createApiInstance: bundle}, function(html) {
                        res.send(html);
                    });
                });
        }
    });

    // Setup components
    app.use('/panel/'+bundle.name+'/components', ncgUtils.authCheck,
        express.static(path.join(bundle.dir, 'bower_components'), {maxAge: 60*60*24*7*1000}));

    // Setup extra files
    app.use('/panel/'+bundle.name+'/', ncgUtils.authCheck,
        express.static(bundle.dashboard.dir, {maxAge: 60*60*24*7*1000}));
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
