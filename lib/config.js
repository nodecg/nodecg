'use strict';

var fs = require('fs');
var extend = require('extend');
var path = require('path');

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
        syncedVars: false,
        console: {
            enabled: true,
            level: 'info'
        },
        file: {
            enabled: true,
            path: 'logs/server.log',
            level: 'info'
        }
    },
    ssl: {
        enabled: false,
        allowHTTP: false,
        // Path to private key & certificate
        keyPath: '',
        certificatePath: ''
    }
};

var config = null;
var filteredConfig = null;

// Create the cfg dir if it does not exist
var cfgDirPath = path.resolve(__dirname, '..', 'cfg');
if (!fs.existsSync(cfgDirPath)) {
    fs.mkdirSync(cfgDirPath);
}

var defaultConfigCopy = extend(true, {}, defaultConfig);

// Load user config if it exists, and merge it
var cfgPath = path.join(cfgDirPath, 'nodecg.json');
if (fs.existsSync(cfgPath)) {
    var userConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    config = extend(true, defaultConfig, userConfig);

    if (!config.listen) {
        config.listen = config.port;
    }

    if (!config.baseURL) {
        config.baseURL = config.host + ':' + config.port;
    }
} else {
    config = defaultConfigCopy;
    config.listen = config.port;
    config.baseURL = config.host + ':' + config.port;
}

// Create the filtered config
filteredConfig = {
    host: config.host,
    port: config.port,
    baseURL: config.baseURL,
    login: {
        enabled: config.login.enabled,
        steam: {
            enabled: config.login.steam.enabled
        },
        twitch: {
            enabled: config.login.twitch.enabled,
            clientID: config.login.twitch.clientID,
            scope: config.login.twitch.scope
        }
    },
    logging: {
        syncedVars: config.logging.syncedVars
    },
    ssl: {
        enabled: config.ssl.enabled
    }
};

exports.getConfig = function() {
    return extend(true, {}, config);
};

exports.getFilteredConfig = function() {
    return extend(true, {}, filteredConfig);
};

module.exports = exports;
