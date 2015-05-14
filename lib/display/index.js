'use strict';

var express = require('express');
var configHelper = require('../config');
var log = require('../logger')('nodecg/lib/display');
var bundles = require('../bundles');
var clientIncludes = require('../client_includes');
var favicon = require('express-favicon');
var path = require('path');
var fs = require('fs');
var utils = require('../util');
var jade = require('jade');
var extend = require('extend');

var app = express();
var filteredConfig = configHelper.getFilteredConfig();
var publicPath = path.join(__dirname, 'public');

log.trace('Adding Express routes');
app
    .use('/display', express.static(publicPath))
    .use(favicon(publicPath + '/img/favicon.ico'))
    .use(clientIncludes);
app.set('views', publicPath);

app.get('/display', utils.authCheck, function(req, res) {
    var views = [];

    if (req.query.view) {
        var viewRefs = Array.isArray(req.query.view) ? req.query.view : [req.query.view];

        viewRefs.forEach(function(viewRef) {
            var bundle = bundles.find(viewRef.split(':')[0]);

            if (bundle) {
                var viewName = viewRef.split(':')[1];
                var view = null;

                for (var i = 0; i < bundle.display.views.length; i++) {
                    if (bundle.display.views[i].name === viewName) {
                        view = extend(true, {}, bundle.display.views[i]);
                        view.bundle = bundle;
                    }
                }

                if (view) {
                    views.push(view);
                }
            }
        });
    }
    else {
        bundles.all().forEach(function(bundle) {
            for (var i = 0; i < bundle.display.views.length; i++) {
                var view = extend(true, {}, bundle.display.views[i]);
                view.bundle = bundle;

                views.push(view);
            }
        })
    }

    var width = req.query.width || 1280;
    var height = req.query.height || 720;

    res.render(__dirname + '/src/display.jade', {
        width: width,
        height: height,
        views: views,
        ncgConfig: filteredConfig
    });
});

app.get('/display/:bundle/components/*', function(req, res, next) {
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

app.get('/display/:bundle/*', function(req, res, next) {
    var bundleName = req.params.bundle;
    var bundle = bundles.find(bundleName);
    if (!bundle) {
        next();
        return;
    }

    var resName = req.params[0];
    var fileLocation = path.join(bundle.display.dir, resName);

    // Check if the file exists
    if (!fs.existsSync(fileLocation)) {
        next();
        return;
    }

    res.sendFile(fileLocation);
});

module.exports = app;
