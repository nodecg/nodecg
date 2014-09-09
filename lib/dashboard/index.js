var express = require('express'),
    app = module.exports = express(),
    config = require('../../config.js'),
    Bundles = require('../bundles');

app.set('views', __dirname);

app.get('/', function(req, res) {
    res.redirect('/dashboard');
});

app.get('/dashboard', ensureAuthenticated, function(req, res) {
    Bundles.all()
    .then(function (bundles) {
        res.render('dashboard.jade', {bundles: bundles, config: config});
    }, function (reason) {
        console.log('Failed to load dashboard: ' + reason);
    });
});

app.get('/nodecg-api.js', function(req, res) {
  res.render('../includes/nodecg-api.ejs', {host: config.host, port: config.port});
});

function ensureAuthenticated(req, res, next) {
    if (!config.login.enabled)
        return next();

    var allowed = false;
    if (req.user !== undefined)
        allowed = req.user.allowed;

    if (req.isAuthenticated() && allowed)
        return next();

    res.redirect('/login');
}