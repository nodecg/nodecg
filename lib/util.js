'use strict';

var cheerio = require('cheerio');
var fs = require('fs');
var tokens = require('./login/tokens');
var util = require('util');

// Open the sessions database
var Datastore = require('nedb');
var sessionDB = new Datastore({ filename: './db/sessions.db', autoload: true });

// Automatically compact the DB every 5 minutes
sessionDB.persistence.setAutocompactionInterval(300000);

var config = require('./config').getConfig();
var filteredConfig = require('./config').getFilteredConfig();

exports.authCheck = function (req, res, next) {
    if (!config.login.enabled) {
        return next();
    }

    var allowed = (req.user !== undefined) ? req.user.allowed : false;
    var provider = (req.user !== undefined) ? req.user.provider : 'none';
    var providerAllowed = (provider !== 'none') ? config.login[provider].enabled : false;

    if (req.isAuthenticated() && allowed && providerAllowed) {
        // Create token
        tokens.findOrCreate({ provider: provider, id: req.user.id }, function(err, token) {
            if (err) {
                throw err;
            }

            // To set a cookie on localhost, domain must be "null"
            var domain = config.host === 'localhost'
                ? null
                : '.' + config.host;
            res.cookie('socketToken', token, { domain: domain });
            next();
        });
    } else if (req.query.key) {
        tokens.find({ token: req.query.key }, function(err, token) {
            if (err) {
                throw err;
            }

            if (token) {
                next();
            }
            else {
                req.session.returnTo = req.url;
                res.redirect('/login');
            }
        });
    } else {
        req.session.returnTo = req.url;
        res.redirect('/login');
    }
};

exports.destroySession = function(sid, cb) {
    sessionDB.remove({ sid: sid }, { multi: false }, function (err) {
        cb(err);
    });
};

exports.findSession = function(params, cb) {
    params = params || {};
    sessionDB.findOne(params, function (err, doc) {
        if (err) {
            cb(err);
        } else {
            cb(null, doc);
        }
    });
};

exports.injectAPI = function(fileLocation, bundle, isDashboard) {
    var file = fs.readFileSync(fileLocation);
    var $ = cheerio.load(file);

    // All injections need nodecg-api, duh
    var scripts = ['<script src="/nodecg-api.js"></script>'];

    if (isDashboard) {
        // Dashboard panels only need to reference parent socket
        scripts.push('<script>window.nodecg = new NodeCG(%s, parent.socket);</script>');
    } else {
        // Graphics need to create their own socket
        scripts.unshift('<script src="/socket.io/socket.io.js"></script>');

        if (config.login.enabled) {
            scripts.push('<script>var socket = io.connect("//%s/", { query: "token=" + qs["key"] });');
        } else {
            scripts.push('<script>var socket = io.connect("//%s/");');
        }

        scripts[2] = util.format(scripts[2], filteredConfig.baseURL);
        scripts.unshift('<script src="/login/QueryString.js"></script>');

        scripts.push('window.nodecg = new NodeCG(%s, socket);</script>');
    }

    scripts = scripts.join('\n');

    var partialBundle = {
        name: bundle.name,
        config: bundle.config
    };

    scripts = util.format(scripts, JSON.stringify(partialBundle));

    var currentHead = $('head').html();
    $('head').html(scripts + currentHead);

    return $.html();
};

exports.versionCompare = function (v1, v2, options) {
    var lexicographical = options && options.lexicographical;
    var zeroExtend = options && options.zeroExtend;
    var v1parts = v1.split('.');
    var v2parts = v2.split('.');

    function isValidPart(x) { return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x); }
    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) { return NaN; }
    if (zeroExtend) {
        while (v1parts.length < v2parts.length) v1parts.push('0');
        while (v2parts.length < v1parts.length) v2parts.push('0');
    }
    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }
    for (var i = 0; i < v1parts.length; ++i) {
        if (v2parts.length === i) { return 1; }
        if (v1parts[i] === v2parts[i]) { continue; }
        else if (v1parts[i] > v2parts[i]) { return 1; }
        else { return -1; }
    }
    if (v1parts.length !== v2parts.length) { return -1; }
    return 0;
};

module.exports = exports;
