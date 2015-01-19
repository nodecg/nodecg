'use strict';

var fs = require('fs'),
    extend = require('extend'),
    path = require('path'),
    util = require('util');

var defaultConfig = {
    host: 'localhost',
    port: 9090,

    login: {
        enabled: false,
        sessionSecret: 'secretsecret',

        // Steam powered log in, get API key from http://steamcommunity.com/dev/apikey
        steam: {
            enabled: false,
            apiKey: 'XXXXX',

            //Only allow certain people to log in. Currently uses 64 bit Steam IDs.
            allowedIds: [
                '11111111111111111',
                '22222222222222222'
            ]
        },

        // Twitch login, get clientID/clientSecret from http://www.twitch.tv/kraken/oauth2/clients/new
        twitch: {
            enabled: false,
            clientID: 'twitch_client_id',
            clientSecret: 'twitch_client_secret',
            scope: 'user_read',

            //Only allow certain people to log in.
            allowedUsernames: [
                'some_name',
                'another_name'
            ]
        }
    },
    logging: {
        console: {
            enabled: true,
            level: 'debug'
        },
        file: {
            enabled: true,
            path: 'logs/server.log',
            level: 'info'
        }
    }
};

var baseDir = null;
var config = null;
var filteredConfig = null;

exports.init = function(baseDirectory) {
    if (baseDir !== null) {
        throw new Error('Config helper already initialised!');
    }

    baseDir = baseDirectory;

    // Create the cfg dir if it does not exist
    var cfgPath = path.join(baseDir, 'cfg');
    if (!fs.existsSync(cfgPath)) {
        fs.mkdirSync(cfgPath);
    }

    _readConfig();
};

exports.getConfig = function() {
    return extend(true, {}, config);
};

exports.getFilteredConfig = function() {
    return extend(true, {}, filteredConfig);
};

exports.getBaseDirectory = function() {
    return baseDir;
};

function _readConfig() {
    var defaultConfigCopy = extend(true, {}, defaultConfig);

    // Load user config if it exists, and merge it
    var cfgPath = path.join(baseDir, 'cfg', 'nodecg.json');
    if (fs.existsSync(cfgPath)) {
        var userConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        config = extend(true, defaultConfigCopy, userConfig);
    } else {
        config = defaultConfigCopy;
    }

    _createFilteredConfig();
}

function _createFilteredConfig() {
    filteredConfig = {
        host: config.host,
        port: config.port,
        login: {
            enabled: config.login.enabled,
            steam: {
                enabled: config.login.steam.enabled
            },
            twitch: {
                enabled: config.login.twitch.enabled
            }
        }
    };
}

module.exports = exports;
