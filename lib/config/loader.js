'use strict';

var fs = require('fs');
var path = require('path');
var extend = require('extend');
var defaults = require('json-schema-defaults');
var validator = require('is-my-json-valid');
var clone = require('clone');

// Create the cfg dir if it does not exist
var cfgDirPath = path.resolve(__dirname, '../../cfg');
/* istanbul ignore next: Simple directory creation, we know it will work. */
if (!fs.existsSync(cfgDirPath)) {
    fs.mkdirSync(cfgDirPath);
}

var config;
var schema = {
    $schema: 'http://json-schema.org/draft-04/schema#',
    type: 'object',

    definitions: {
        level: {
            description: 'The lowest level of output to log. "trace" is the most output, "error" is the least output.',
            enum: [ 'trace', 'debug', 'info', 'warn', 'error' ],
            default: 'info'
        }
    },

    properties: {
        host: {
            description: 'The IP address or hostname that NodeCG should bind to.',
            type: 'string',
            default: 'localhost'
        },
        port: {
            description: 'The port that NodeCG should listen on.',
            type: 'integer',
            default: 9090
        },
        developer: {
            description: 'Whether to enable features that speed up development. Not suitable for production.',
            type: 'boolean',
            default: false
        },
        logging: {
            type: 'object',
            properties: {
                replicants: {
                    description: 'Whether to enable logging of the Replicants subsystem. Very spammy.',
                    type: 'boolean',
                    default: false
                },
                console: {
                    type: 'object',
                    properties: {
                        enabled: {
                            description: 'Wehther to enable console logging.',
                            type: 'boolean',
                            default: true
                        },
                        level: {$ref: '#/definitions/level'}
                    }
                },
                file: {
                    type: 'object',
                    properties: {
                        enabled: {
                            description: 'Wehther to enable file logging.',
                            type: 'boolean',
                            default: false
                        },
                        path: {
                            description: 'The filepath to log to.',
                            type: 'string',
                            default: 'logs/nodecg.log'
                        },
                        level: {$ref: '#/definitions/level'}
                    }
                }
            }
        }
    }
};

module.exports = function(userCfgPath) {
    // Load user config if it exists, and merge it
    if (fs.existsSync(userCfgPath)) {
        var rawUserConfigFile = fs.readFileSync('cfg/nodecg.json', 'utf8');

        var userConfig;
        try {
            userConfig = JSON.parse(rawUserConfigFile);
        } catch (e) {
            console.info('[nodecg] Failed to parse "cfg/nodecg.json". Please ensure that it contains only valid JSON.');
            process.exit(1);
            return;
        }

        if (userConfig.login && userConfig.login.enabled) {
            schema.properties.login = {
                type: 'object',
                properties: {
                    enabled: {
                        description: 'Wehther to enable login security.',
                        type: 'boolean',
                        default: false
                    },
                    sessionSecret: {
                        description: 'The secret used to salt sessions.',
                        type: 'string'
                    }
                },
                required: ['sessionSecret']
            };

            if (userConfig.login.steam.enabled) {
                schema.properties.login.steam = {
                    type: 'object',
                    properties: {
                        enabled: {
                            description: 'Whether to enable Steam authentication.',
                            type: 'boolean',
                            default: false
                        },
                        apiKey: {
                            description: 'A Steam API Key. Obtained from http://steamcommunity.com/dev/apikey',
                            type: 'string'
                        },
                        allowedIds: {
                            description: 'Which 64 bit Steam IDs to allow. Can be obtained from https://steamid.io/',
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        }
                    },
                    required: ['apiKey', 'allowedIds']
                };
            }

            if (userConfig.login.twitch.enabled) {
                schema.properties.login.twitch = {
                    type: 'object',
                    properties: {
                        enabled: {
                            description: 'Whether to enable Twitch authentication.',
                            type: 'boolean',
                            default: false
                        },
                        clientID: {
                            description: 'A Twitch application ClientID http://twitch.tv/kraken/oauth2/clients/new',
                            type: 'string'
                        },
                        clientSecret: {
                            description: 'A Twitch application ClientSecret http://twitch.tv/kraken/oauth2/clients/new',
                            type: 'string'
                        },
                        scope: {
                            description: 'A space-separated string of Twitch application permissions.',
                            type: 'string',
                            default: 'user_read'
                        },
                        allowedUsernames: {
                            description: 'Which Twitch usernames to allow.',
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        }
                    },
                    required: ['clientID', 'clientSecret', 'allowedUsernames']
                };
            }
        }

        if (userConfig.ssl && userConfig.ssl.enabled) {
            schema.properties.ssl = {
                type: 'object',
                properties: {
                    enabled: {
                        description: 'Whether to enable SSL/HTTPS encryption.',
                        type: 'boolean',
                        default: false
                    },
                    allowHTTP: {
                        description: 'Whether to allow insecure HTTP connections while SSL is active.',
                        type: 'boolean',
                        default: false
                    },
                    keyPath: {
                        description: 'The path to an SSL key file.',
                        type: 'string'
                    },
                    certificatePath: {
                        description: 'The path to an SSL certificate file.',
                        type: 'string'
                    }
                },
                required: ['keyPath', 'certificatePath']
            };
        }

        var defaultConfig = defaults(schema);
        config = extend(true, defaultConfig, userConfig);
    } else {
        console.info('[nodecg] No config found, using defaults.');
        config = defaults(schema);
    }

    config.listen = config.listen || config.port;
    config.baseURL = config.baseURL || config.host + ':' + config.port;

    var validate = validator(schema, {greedy: true});
    var result = validate(config);
    if (!result) {
        console.error('[nodecg] cfg/nodecg.json is invalid:');
        var errors = validate.errors;
        errors.forEach(function(error) {
            var field = error.field.replace('data.', '');
            console.error('\t%s %s', field, error.message);
        });
        process.exit(1);
    }

    if (config.developer) {
        console.warn('[nodecg] Developer mode is active! Be sure to disable this in production.');
    }

    // Create the filtered config
    var filteredConfig = {
        host: config.host,
        port: config.port,
        developer: config.developer,
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
            replicants: config.logging.replicants,
            console: config.logging.console,
            file: {
                enabled: config.logging.file.enabled,
                level: config.logging.file.level
            }
        },
        ssl: {
            enabled: config.ssl.enabled
        }
    };

    return {
        config: clone(config),
        filteredConfig: clone(filteredConfig)
    };
};
