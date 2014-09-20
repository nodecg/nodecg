var express = require('express'),
    app = module.exports = express(),
    config = require('../../lib/config'),
    path = require('path'),
    fs = require('fs');

app.set('views', process.cwd());

app.get('/viewsetup.js', function(req, res) {
    // Do some entirely silly string operations to extract the bundle name from the referer and pass it to the API setup script
    var referer = req.headers.referer;
    var start = referer.indexOf('/view/') + 6;
    var end = referer.substr(start).indexOf('/') + start;
    var bundleName = referer.substring(start, end);

    res.type('.js');
    res.render('lib/includes/viewsetup.js.ejs', {host: config.host, port: config.port, bundleName: bundleName});
});

app.get('/view/:view_name*', function(req, res) {
    var viewName = req.param('view_name');

    // We start out assuming the user is trying to reach the index page
    var resName = 'index.html';

    /*  We need a trailing slash for view index pages so that relatively linked assets can be reached as expected.
        This behaves a bit weird in that it adds two trailing slashes, this appears to be because both '' and '/'
        don't count as params. Luckily, the fact that we end up with '//' doesn't cause any problems. */
    if (!req.params[0]) {
        res.redirect(req.url + '/');
    }

    // If the first param isn't just a slash, the user must be trying to resolve an asset and not the index page
    if (req.params[0] != '/' && req.params[0] != '//') {
        resName = req.params[0].substr(1);
    }


    var fileLocation = path.join(__dirname, '../../bundles/', viewName, 'view/', resName);;

    // Check if the file exists
    if (!fs.existsSync(fileLocation)) {
        res.status(404).send('Unable to find '+ viewName +'/'+ resName);
    }

    res.sendFile(fileLocation);
});

