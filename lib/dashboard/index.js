'use strict';

var express = require('express'),
    app = express(),
    config = require('../../lib/config'),
    expressLess = require('express-less'),
    log = require('../logger'),
    Bundles = require('../bundles'),
    clientIncludes = require('../client_includes');

log.trace('[lib/dashboard/index.js] Adding Express routes');
app.use('/dashboard', express.static(__dirname + '/public'));
app.use('/dashboard', expressLess(__dirname + '/public', { compress: true }));
app.set('views', __dirname);

app.get('/', function(req, res) {
    res.redirect('/dashboard');
});

app.get('/dashboard', ensureAuthenticated, function(req, res) {
    Bundles.all()
        .then(function (bundles) {
            res.render('public/dashboard.jade', {bundles: bundles, config: config});
        }, function (reason) {
            log.error('[lib/dashboard/index.js] Failed to load dashboard: %s', reason);
        });
});

app.use(clientIncludes);

// TODO: Move this to the future extension API
function ensureAuthenticated(req, res, next) {
    if (!config.login.enabled) {
        return next();
    }

    var allowed = (req.user !== undefined) ? req.user.allowed : false;

    if (req.isAuthenticated() && allowed) {
        return next();
    }

    res.redirect('/login');
}

module.exports = app;
