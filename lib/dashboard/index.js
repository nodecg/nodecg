var express = require('express'),
    app = module.exports = express(),
    config = require('../../config.js'),
    Bundles = require('../bundles');

app.set('views', __dirname);

app.get('/', function(req, res) {
    res.redirect('/dashboard');
});

// needs to be able to access the parent module's "bundles" array of Bundle objects
app.get('/dashboard', ensureAuthenticated, function(req, res) {
    Bundles.all()
    .then(function (value) {
        res.render('dashboard.html', {bundles: value, config: config});
    }, function (reason) {
        console.log('Failed to load dashboard: ' + reason);
    });
});

app.get('/nodecg.js', function(req, res) {
    res.render('js/nodecg.ejs', {host: config.host, port: config.port})
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