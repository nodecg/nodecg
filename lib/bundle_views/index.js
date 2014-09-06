var express = require('express'),
    app = module.exports = express(),
    config = require('../../config.js'),
    file = require('file'),
    fs = require('fs');

app.set('views', process.cwd());

app.get('/view/:view_name*', function(req, res) {
    var viewName = req.param('view_name');

    // We start out assuming the user is trying to reach the index page
    var resName = 'index.jade';

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

    var fileLocation = 'bundles/' + viewName + '/view/' + resName;

    // Check if the file exists
    if (!fs.existsSync(fileLocation)) {
        res.status(404).send('Unable to find '+ viewName +'/'+ resName);
    }

    if (resName.endsWith('.jade')) {
        res.render(fileLocation, {bundleName: viewName, config: config});
    } else {
        res.sendfile(fileLocation);
    }
});

