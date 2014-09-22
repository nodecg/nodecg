var express = require('express'),
    app = module.exports = express(),
    config = require('../../lib/config'),
    expressLess = require('express-less'),
    Bundles = require('../bundles');

app.use('/dashboard', express.static(__dirname + '/public'));
app.use('/dashboard', expressLess(__dirname + '/public', { compress: true }));
app.set('views', process.cwd() + '/lib/dashboard/');

app.get('/', function(req, res) {
    res.redirect('/dashboard');
});

app.get('/dashboard', ensureAuthenticated, function(req, res) {
    Bundles.all()
    .then(function (bundles) {
        res.render('public/dashboard.jade', {bundles: bundles, config: config});
    }, function (reason) {
        console.log('Failed to load dashboard: ' + reason);
    });
});

app.get('/nodecg-api.js', function(req, res) {
  res.render('../includes/nodecg-api.js.ejs', {host: config.host, port: config.port});
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