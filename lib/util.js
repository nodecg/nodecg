'use strict';

var tokens = require('./login/tokens');

// Open the sessions database
var Datastore = require('nedb');
var sessionDB = new Datastore({ filename: './db/sessions.db', autoload: true });

// Automatically compact the DB every 5 minutes
sessionDB.persistence.setAutocompactionInterval(300000);

var config = require('./config').getConfig();

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
    } else {
        req.session.returnTo = req.url;
        res.redirect('/login');
    }
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

exports.destroySession = function(sid, cb) {
    sessionDB.remove({ sid: sid }, { multi: false }, function (err) {
        cb(err);
    });
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
