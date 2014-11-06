var express = require('express'),
    app = module.exports = express(),
    config = require('../../lib/config'),
    path = require('path'),
    fs = require('fs'),
    Bundles = require('../bundles');

require('string.prototype.endswith');

app.set('views', process.cwd());

app.get('/viewsetup.js', function(req, res) {
    // Do some entirely silly string operations to extract the bundle name from the referer and pass it to the API setup script
    var referer = req.headers.referer;
    var start = referer.indexOf('/view/') + 6;
    var end = referer.indexOf('/', start + 1);
    var bundleName = referer.substring(start, end);

    res.type('.js');
    res.render('lib/includes/viewsetup.js.ejs', {host: config.host, port: config.port, bundleName: bundleName});
});

app.get('/view/:bundle_name*', function(req, res, next) {
    var bundleName = req.param('bundle_name');

    Bundles.find(bundleName)
        .then(function(bundle) {
            // We start out assuming the user is trying to reach the index page
            var resName = 'index.html';

            /*  We need a trailing slash for view index pages so that relatively linked assets can be reached as expected.
             This behaves a bit weird in that it adds two trailing slashes, this appears to be because both '' and '/'
             don't count as params. Luckily, the fact that we end up with '//' doesn't cause any problems. */
            if (!req.params[0] && !req.url.endsWith('/')) {
                res.redirect(req.url + '/');
                return;
            }

            // If the first param isn't just a slash, the user must be trying to resolve an asset and not the index page
            if (req.params[0] !== '/' && !req.url.endsWith('/')) {
                resName = req.params[0].substr(1);
            }

            var fileLocation = path.join(__dirname, '../../', bundle.dir, 'view/', resName);

            // Check if the file exists
            if (!fs.existsSync(fileLocation)) {
                next();
                return;
            }

            res.sendFile(fileLocation);
        }, function (err) {
            next();
        });
});
