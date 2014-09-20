var fs = require('fs'),
    extend = require('extend');

var config = {
    host: 'localhost',
    port: 9090,

    // Steam powered log in, get API key from http://steamcommunity.com/dev/apikey
    login: {
        enabled: false,
        sessionSecret: 'secretsecret',
        steamApiKey: 'XXXXX',

        //Only allow certain people to log in. Currently uses 64 bit Steam IDs.
        allowedIds: [
            '11111111111111111',
            '22222222222222222'
        ]
    }

    /**
     * ! Not implemented !
     * How many people should be able to control the overlay at once?
     * 0 or below = no limit
     */
    //maxControllers: 0,
};

// Load user config if it exists, and merge it
if (fs.existsSync('config.json')) {
    var userConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    extend (true, config, userConfig);
}

module.exports = config;
