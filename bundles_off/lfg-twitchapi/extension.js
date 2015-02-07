'use strict';

var nodecg, session;
var request = require('request');
var querystring = require('querystring');

module.exports = function (extensionApi) {
    nodecg = extensionApi;

    if (!Object.keys(nodecg.bundleConfig).length) {
        throw new Error('[lfg-twitchapi] No config found in cfg/lfg-twitchapi.json, aborting!');
    }

    // Non-confidential session details are made available to dashboard & view
    nodecg.declareSyncedVar({ name: 'session', initialVal: {} });

    // Find the twitch session with the desired username
    session = getSession();

    // The desired session might not exist at load-time.
    // We also provide a button on the dashboard that the user can click after they've logged in.
    nodecg.listenFor('getSession', function() { session = getSession(); });

    // Return the function used to make API calls, so other bundles can use it
    return apiCall;
};

function apiCall(method, path, options, callback) {
    method = typeof method !== 'undefined' ? method : 'GET';
    options = typeof options !== 'undefined' ? options : {};
    path = typeof path === 'string' ? path : '';
    callback = typeof callback === 'function' ? callback : function () {};

    options = querystring.stringify(options);

    var requestOptions = {
        url: 'https://api.twitch.tv/kraken' + path + (options ? '?' + options : ''),
        headers: {
            'Accept': 'application/vnd.twitchtv.v3+json',
            'Client-ID': nodecg.config.login.twitch.clientID
        },
        method: method
    };

    if (session) {
        requestOptions.headers.Authorization = 'OAuth ' + session.data.passport.user.accessToken;
    }

    request(requestOptions, function (error, response, body) {
        if (error) { return callback(error); }

        try { body = JSON.parse(body); }
        catch (error) { return callback(error); }

        return callback(null, response.statusCode, body);
    });
}

function getSession() {
    // Find the desired session, which contains the accessToken needed to make Twitch API requests
    var s = nodecg.util.findSession({
        'data.passport.user.provider': 'twitch',
        'data.passport.user.username': nodecg.bundleConfig.username
    });

    // Return undefined if session wasn't found
    if (!s) return;

    // Update the 'session' syncedVar with only the non-confidential information
    nodecg.variables.session = {
        provider: s.data.passport.user.provider, // should ALWAYS be 'twitch'
        username: s.data.passport.user.username,
        displayName: s.data.passport.user.displayName,
        logo: s.data.passport.user._json.logo,
        url: s.data.passport.user._json._links.self
    };

    return s;
}
