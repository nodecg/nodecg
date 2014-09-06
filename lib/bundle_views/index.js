var express = require('express'),
    app = module.exports = express(),
    config = require('../../config.js'),
    file = require('file'),
    fs = require('fs');

var viewSetupScript =
    '<script src="/socket.io/socket.io.js"></script>\r\n' +
    '<script>window.__ncg__bundlename__ = \'BUNDLENAME\';</script>' +
    '<script src="/nodecg.js"></script>';

app.set('views', process.cwd());

app.get('/view/:view_name*', function(req, res) {
    var viewName = req.param('view_name');

    var resName = 'index.html';
    if (!req.params[0]) {
        res.redirect(req.url + '/');
    }

    if (req.params[0] != '/' && req.params[0] != '//') {
        resName = req.params[0].substr(1);
    }

    var fileLocation = 'bundles/' + viewName + '/view/' + resName;

    // Check if the file exists
    if (!fs.existsSync(fileLocation)) {
        res.status(404).send('Unable to find '+ viewName +'/'+ resName);
    }

    if (resName.endsWith('html') || resName.endsWith('ejs')) {
        res.render(fileLocation, {setupScript: viewSetupScript.replace('BUNDLENAME', viewName)});
    } else {
        res.sendfile(fileLocation);
    }
});

