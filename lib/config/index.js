var fs = require('fs');

var config = {
    host: 'localhost',
    port: 9090,

    // Steam powered log in, get API key from http://steamcommunity.com/dev/apikey
    login: {
        enabled: false,
        sessionSecret: 'secretsecret',
        steamReturnURL: 'http://'+ this.host +':'+ this.port +'/login/auth',
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

if (fs.existsSync('config.js')) {
    return;
}

// Export
module.exports = config;
