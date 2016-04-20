'use strict';

var express = require('express');
var app = express();
var configHelper = require('./config');
var config = configHelper.getConfig();
var filteredConfig = configHelper.getFilteredConfig();
var cheerio = require('cheerio');
var fs = require('fs');
var path = require('path');
var util = require('util');
var log = require('./logger')('nodecg/lib/bundle_views');
var Bundles = require('./bundles');

require('string.prototype.endswith');
log.trace('Adding Express routes');
app.set('views', path.resolve(__dirname, '..'));

app.get('/view/:bundleName*', function(req, res, next) {
    var bundleName = req.params.bundleName;
    var bundle = Bundles.find(bundleName);
    if (!bundle) {
        next();
        return;
    }

    // We start out assuming the user is trying to reach the index page
    var resName = 'index.html';

    //  We need a trailing slash for view index pages so that relatively linked assets can be reached as expected.
    if (req.path.endsWith(bundleName)) {
        res.redirect(req.url.replace(bundleName, bundleName + '/'));
        return;
    }

    // If the url path is just ":bundleName/", then the user is trying to resolve an asset and not the index page.
    if (!req.path.endsWith(bundleName + '/')) {
        resName = req.params[0].substr(1);
    }

    var fileLocation = path.join(bundle.dir, 'view', resName);

    // Check if the file exists
    if (!fs.existsSync(fileLocation)) {
        next();
        return;
    }

    // If it's a HTML file, inject the viewsetup script and serve that
    // otherwise, send the file unmodified
    if (resName.endsWith('.html')) {
        var file = fs.readFileSync(fileLocation);
        var $ = cheerio.load(file);

        var scripts = [
            '<script src="/components/object.observe/dist/object-observe.min.js"></script>',
            '<script src="/components/array.observe/array-observe.min.js"></script>',
            '<script src="/shims/WeakMap.js"></script>',
            '<script src="/socket.io/socket.io.js"></script>',
            '<script src="/nodecg-api.js"></script>',
            '<script>var socket = io.connect("//%s/");',
            'window.nodecg = new NodeCG(%s, socket);</script>'
        ];

        if (config.login.enabled) {
            scripts[4] = '<script>var socket = io.connect("//%s/", { query: "token=" + qs["key"] });';
            scripts.unshift('<script src="/login/QueryString.js"></script>');
        }

        scripts = scripts.join('\n');

        var partialBundle = {
            name: bundle.name,
            config: bundle.config
        };

        scripts = util.format(scripts, filteredConfig.baseURL, JSON.stringify(partialBundle));

        var currentHead = $('head').html();
        $('head').html(scripts + currentHead);

        res.send($.html());
    } else {
        res.sendFile(fileLocation);
    }
});

app.get('/view/:bundle/components/*', function(req, res, next) {
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

module.exports = app;
