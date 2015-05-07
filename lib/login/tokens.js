/* jshint -W052, -W106 */
'use strict';

var xtend = require('xtend');
var UnauthorizedError = require('./UnauthorizedError');
var Datastore = require('nedb');
var db = new Datastore({ filename: './db/tokens.db', autoload: true });
var log = require('../logger')('nodecg/lib/login/tokens');
var uuid = require('uuid').v4;
db.persistence.setAutocompactionInterval(15 * 60 * 1000);

function authorize(options) {
    var defaults = {
        success: function(data, accept){
            if (data.request) {
                accept();
            } else {
                accept(null, true);
            }
        },
        fail: function(error, data, accept){
            if (data.request) {
                accept(error);
            } else {
                accept(null, false);
            }
        }
    };

    var auth = xtend(defaults, options);

    return function(data, accept){
        var token, error;
        var req = data.request || data;
        var authorization_header = (req.headers || {}).authorization;

        if (authorization_header) {
            var parts = authorization_header.split(' ');
            if (parts.length == 2) {
                var scheme = parts[0],
                    credentials = parts[1];

                if (/^Bearer$/i.test(scheme)) {
                    token = credentials;
                }
            } else {
                error = new UnauthorizedError('credentials_bad_format', {
                    message: 'Format is Authorization: Bearer [token]'
                });
                return auth.fail(error, data, accept);
            }
        }

        //get the token from query string
        if (req._query && req._query.token) {
            token = req._query.token;
        }
        else if (req.query && req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            error = new UnauthorizedError('credentials_required', {
                message: 'No Authorization header was found'
            });
            return auth.fail(error, data, accept);
        }

        db.findOne({ token: token }, function (err, doc) {
            if (err) {
                error = new UnauthorizedError('internal_error', err);
                return auth.fail(error, data, accept);
            }

            if (!doc || !doc.token) {
                error = new UnauthorizedError('invalid_token', 'Token could not be found');
                return auth.fail(error, data, accept);
            }

            data.token = token;
            auth.success(data, accept);
        });
    };
}

// Attempt to find an existing token for the provided search parmeters.
// If found, return that token.
// If not, make a new token (just a uuid string).
function findOrCreate(params, cb) {
    if (typeof cb !== 'function') {
        throw new Error('Callback must be a function');
    }

    db.findOne(params, function (err, doc) {
        if (err) {
            cb(err);
            return;
        }

        if (doc) {
            cb(null, doc.token);
        } else {
            params.token = uuid();
            db.insert(params, function (err, newDoc) {
                if (err) {
                    cb(err);
                    return;
                }

                cb(null, newDoc.token);
            });
        }
    });
}

function find(params, cb) {
    if (typeof cb !== 'function') {
        throw new Error('Callback must be a function');
    }

    db.findOne(params, function (err, doc) {
        if (err) {
            cb(err);
            return;
        }

        cb(null, doc ? doc.token : null);
    });
}

function regenerate(token, cb) {
    var newToken = uuid();
    cb = cb || function(){};
    db.update({ token: token }, { token: newToken }, function (err, numReplaced) {
        if (err) {
            cb(err);
            return;
        }

        if (numReplaced <= 0) {
            cb(new Error('Could not find existing token ' + token));
            return;
        }

        cb(null, newToken);
    });
}

module.exports.findOrCreate = findOrCreate;
module.exports.find = find;
module.exports.authorize = authorize;
module.exports.regenerate = regenerate;
