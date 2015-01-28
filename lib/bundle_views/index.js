'use strict';

var express = require('express');
var app = express();
var configHelper = require('../config');
var filteredConfig = configHelper.getFilteredConfig();
var path = require('path');
var fs = require('fs');
var log = require('../logger')('nodecg/lib/bundle_views');
var Bundles = require('../bundles');

require('string.prototype.endswith');

log.trace('Adding Express routes');

app.set('views', path.resolve(__dirname, '../..'));

app.get('/viewsetup.js', function(req, res) {
    // Do some entirely silly string operations to extract the bundle name
    // from the referer and pass it to the API setup script
    // TODO: Must be a better way, surely
    var referer = req.headers.referer;
    var bundleName = null;

    if (!referer) {
        // Zombie is the headless browser that NodeCG uses for testing
        // For some reason, it does not send a referer header when requesting viewsetup.js
        // This is a workaround for that
        if (req.headers['user-agent'].indexOf('Zombie.js')) {
            bundleName = 'test-bundle';
        } else {
            log.error('viewsetup.js requested with no referer by', req.connection.remoteAddress);
            res.status(400).send('Bad Request, no referer');
            return;
        }
    } else {
        var start = referer.indexOf('/view/') + 6;
        var end = referer.indexOf('/', start + 1);
        bundleName = referer.substring(start, end);
    }

    var bundle = Bundles.find(bundleName);
    res.type('.js');
    res.render('lib/client_includes/viewsetup.js.ejs', {
        bundleName: bundle.name,
        ncgConfig: JSON.stringify(filteredConfig),
        bundleConfig: JSON.stringify(bundle.config)
    });
});

app.get('/view/:bundleName*', function(req, res, next) {
    var bundleName = req.params.bundleName;

    var bundle = Bundles.find(bundleName);
    // We start out assuming the user is trying to reach the index page
    var resName = 'index.html';

    /*  We need a trailing slash for view index pages so that relatively linked assets can be reached as expected. */
    if (!req.params[0] && !req.url.endsWith('/')) {
        res.redirect(req.url + '/');
        return;
    }

    // If the first param isn't just a slash, the user must be trying to resolve an asset and not the index page
    if (req.params[0] !== '/' && !req.url.endsWith('/')) {
        resName = req.params[0].substr(1);
    }

    var fileLocation = path.join(bundle.dir, 'view', resName);

    // Check if the file exists
    if (!fs.existsSync(fileLocation)) {
        next();
        return;
    }

    res.sendFile(fileLocation);
});

module.exports = app;
