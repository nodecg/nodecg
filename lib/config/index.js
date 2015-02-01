'use strict';

var fs = require('fs'),
    extend = require('extend'),
    path = require('path');

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
    },
    ssl: {
        enabled: false,
        // Path to private key & certificate
        keyPath: '',
        certificatePath: ''
    }
};

var config = null;
var filteredConfig = null;

// Create the cfg dir if it does not exist
var cfgDirPath = path.resolve(__dirname, '../..', 'cfg');
if (!fs.existsSync(cfgDirPath)) {
    fs.mkdirSync(cfgDirPath);
}

var defaultConfigCopy = extend(true, {}, defaultConfig);

// Load user config if it exists, and merge it
var jsonPath = path.join(cfgDirPath, 'nodecg.json');
var cfgPath = path.join(cfgDirPath, 'nodecg.cfg');
if (fs.existsSync(jsonPath)) {
    // Check if .cfg exists, warn if so
    if (fs.existsSync(cfgPath)) {
        console.warn('warning: cfg/nodecg.json and cfg/nodecg.cfg detected!' +
            'NodeCG will use nodecg.json, it is recommended you delete one of these!');
    }
    parseConfig(jsonPath, defaultConfigCopy);
} else if (fs.existsSync(cfgPath)) {
    // Warn that the file should be called .json
    console.warn('warning: NodeCG prefers cfg/nodecg.json,' +
        ' it is recommended you rename your config file to nodecg.json!');
    parseConfig(cfgPath, defaultConfigCopy);
} else {
    config = defaultConfigCopy;
}

function parseConfig(path, defaults) {
    var userConfig = JSON.parse(fs.readFileSync(path, 'utf8'));
    config = extend(true, defaults, userConfig);
}

// Create the filtered config
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

exports.getConfig = function() {
    return extend(true, {}, config);
};

exports.getFilteredConfig = function() {
    return extend(true, {}, filteredConfig);
};

module.exports = exports;
