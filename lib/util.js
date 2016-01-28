'use strict';

var cheerio = require('cheerio');
var fs = require('fs');
var tokens = require('./login/tokens');
var util = require('util');

// Open the sessions database
var Datastore = require('nedb');
var sessionDB = new Datastore({filename: './db/sessions.db', autoload: true});

// Automatically compact the DB every 5 minutes
sessionDB.persistence.setAutocompactionInterval(300000);

var config = require('./config').config;
var filteredConfig = require('./config').filteredConfig;

exports.authCheck = function (req, res, next) {
    if (!config.login.enabled) {
        return next();
    }

    // To set a cookie on localhost, domain must be "null"
    var domain = config.host === 'localhost'
        ? null
        : '.' + config.host;

    var allowed = (req.user !== undefined) ? req.user.allowed : false;
    var provider = (req.user !== undefined) ? req.user.provider : 'none';
    var providerAllowed = (provider !== 'none') ? config.login[provider].enabled : false;

    if (req.query.key || req.cookies.socketToken) {
        tokens.find({token: req.query.key || req.cookies.socketToken}, function (err, token) {
            if (err) throw err;
            if (token) next();
            else {
                // TODO: This doesn't seem to work.
                // Ensure we delete the existing cookie so that it doesn't become poisoned
                // and cause an infinite login loop.
                req.session.destroy(function() {
                    res.clearCookie('connect.sid');
                    res.clearCookie('socketToken');
                    res.redirect('/login');
                });
            }
        });
    } else if (req.isAuthenticated() && allowed && providerAllowed) {
        // Create token
        tokens.findOrCreate({provider: provider, id: req.user.id}, function(err, token) {
            if (err) throw err;


            res.cookie('socketToken', token, {domain: domain});
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
        if (err) cb(err);
        else cb(null, doc);
    });
};

exports.injectScripts = function (pathOrHtml, resourceType, opts, cb) {
    // Graphics only pass the path to the html file.
    // Panels and dialogs pass a cached HTML string.
    if (resourceType === 'graphic') {
        fs.readFile(pathOrHtml, inject);
    } else {
        inject(null, pathOrHtml);
    }

    function inject(err, html) {
        var $ = cheerio.load(html);

        // Everything needs the shims and config
        var scripts = [
            '<script src="/components/observe-shim/lib/observe-shim.js"></script>',
            '<script src="/shims/WeakMap.js"></script>',
            '<script>window.ncgConfig = ' + JSON.stringify(filteredConfig) + ';</script>'
        ];

        var styles = [];

        if (resourceType === 'panel' || resourceType === 'dialog') {
            if (opts.standalone) {
                // load the API
                scripts.push('<script src="/nodecg-api.js"></script>');
            } else {
                // Panels and dialogs can grab the API from the dashboard
                scripts.push('<script>window.NodeCG = window.top.NodeCG</script>');
            }

            // Both panels and dialogs need the main default style framework
            scripts.push('<link rel="import" href="/dashboard/style/nodecg-styles.html">');

            if (opts.standalone) {
                // load the socket
                scripts.push('<script src="/components/cookies-js/dist/cookies.min.js"></script>');
                scripts.push('<script src="/components/cn-jsurl/url.min.js"></script>');
                scripts.push('<script src="/socket.io/socket.io.js"></script>');
                scripts.push('<script>' +
                    'var url = new Url;' +
                    'window.token = url.query.key || Cookies.get("socketToken");' +
                    'if (window.token) { ' +
                        'window.socket = io.connect("//" + window.ncgConfig.baseURL + "/", {' +
                            'query: "token=" + window.token' +
                        '});' +
                    '} else { ' +
                        'window.socket = io.connect("//" + window.ncgConfig.baseURL + "/");' +
                    '}' +
                '</script>');
            } else {
                // They both also need to reference the dashboard window's socket, rather than make their own
                scripts.push('<script>window.socket = window.top.socket;</script>');
            }

            // Likewise, they both need the contentWindow portion of the iframeResizer.
            // We put this at the start and make it async so it loads ASAP.
            scripts.unshift('<script async src="/components/iframe-resizer/js/iframeResizer.contentWindow.min.js">' +
                '</script>');

            // Panels need the default panel styles and the dialog_opener
            if (resourceType === 'panel') {
                styles.push('<link rel="stylesheet" href="/dashboard/style/panel.css">');
                scripts.push('<script async src="/dashboard/dialog_opener.js"></script>');
            }

            // Dialogs need the dialog_helper
            else if (resourceType === 'dialog') {
                scripts.push('<script async src="/dashboard/dialog_helper.js"></script>');
            }
        }

        else if (resourceType === 'graphic') {
            // Graphics need to create their own socket
            scripts.push('<script src="/socket.io/socket.io.js"></script>');

            // If login security is enabled, graphics must provide a valid token when they connect to the socket
            // They also need cookies-js and a helper to manage URL query strings
            var socketScript;
            if (config.login.enabled) {
                scripts.push('<script src="/components/cookies-js/dist/cookies.min.js"></script>');
                scripts.push('<script src="/login/QueryString.js"></script>');
                socketScript =
                    '<script>\n' +
                    'window.token = qs["key"] || Cookies.get("socketToken");\n' +
                    'window.socket = io.connect("//%s/",{query: "token=" + window.token});\n' +
                    '</script>';
            } else {
                socketScript = '<script>window.socket = io.connect("//%s/");</script>';
            }
            scripts.push(util.format(socketScript, filteredConfig.baseURL));

            // Graphics must include the API script themselves before attempting to make an instance of it
            scripts.push('<script src="/nodecg-api.js"></script>');
        }

        else {
            throw new Error('Invalid resourceType "' + resourceType + '"');
        }

        // Inject a small script to create a NodeCG API instance, if requested.
        if (opts.createApiInstance) {
            var partialBundle = {
                name: opts.createApiInstance.name,
                config: opts.createApiInstance.config
            };

            scripts.push(
                util.format('<script>window.nodecg = new NodeCG(%s, window.socket);</script>',
                    JSON.stringify(partialBundle))
            );
        }

        // Inject the scripts required for singleInstance behavior, if requested.
        if (opts.singleInstance) {
            scripts.push('<script src="/instance/client_heart.js"></script>');
        }

        scripts = scripts.join('\n');


        // Put our scripts before their first script or HTML import.
        // If they have no scripts or imports, put our scripts at the end of <body>.
        var theirScriptsAndImports = $('script, link[rel="import"]');
        if (theirScriptsAndImports.length > 0) {
            theirScriptsAndImports.first().before(scripts);
        } else {
            $('body').append(scripts);
        }

        // Inject the needed stylesheets, if any.
        // If there are <script> tags in the head, inject before them.
        // Otherwise, add at the end of the <head>.
        if (styles.length > 0) {
            styles = styles.join('\n');

            var headScripts = $('head').find('script');
            if (headScripts.length > 0) {
                headScripts.first().before(styles);
            } else {
                $('head').append(styles);
            }
        }

        cb($.html());
    }
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
