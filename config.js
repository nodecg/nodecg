var config = {};
config.login = {};

config.host = 'localhost';
config.port = 9090;

/**
 * Steam powered log in
 * 
 * Steam API key from http://steamcommunity.com/dev/apikey
 */
config.login.enabled = false;
config.login.sessionSecret = 'secretsecret';
config.login.steamReturnURL = 'http://'+ config.host +':'+ config.port +'/login/auth';
config.login.steamApiKey = 'XXXXX';

/**
 * Only allow certain people to log in
 * Currently uses 64 bit Steam IDs
 */
config.login.allowedIds = [
  '11111111111111111',
  '22222222222222222'
];

/** 
 * ! Not implemented !
 * How many people should be able to control the overlay at once?
 * 0 or below = no limit
 */
//config.maxControllers = 0;


// Export
module.exports = config;
