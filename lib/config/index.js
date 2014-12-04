'use strict';

var fs = require('fs'),
    extend = require('extend'),
    path = require('path');

var config = {
    host: 'localhost',
    port: 9090,

    login: {
        enabled: false,
        sessionSecret: 'secretsecret',

        // Steam powered log in, get API key from http://steamcommunity.com/dev/apikey
        steam: {
            enabled: false,
            steamApiKey: 'XXXXX',

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
            level: 'info'
        },
        file: {
            enabled: true,
            path: 'logs/server.log',
            level: 'trace'
        }
    }
};

// Load user config if it exists, and merge it
var cfgPath = path.join(process.cwd(), 'cfg/nodecg.json');
if (fs.existsSync(cfgPath)) {
    var userConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    extend (true, config, userConfig);
}

// We only want to give the public API a subset of config options
var filteredConfig = {
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

module.exports.config = config;
module.exports.filteredConfig = filteredConfig;
