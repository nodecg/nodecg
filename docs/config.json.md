##Schema
- `host` String. The hostname of the machine running this instance of NodeCG.

- `port` Integer. The port number you'd like this instance to listen to.

- `login` Object. Contains other configuration properties.

    - `enabled` Boolean. Whether or not to enable login.

    - `sessionSecret` String. Secret key used for login sessions.

    - `steam` Object. Contains steam login configuration properties.

        - `enabled` Boolean. Whether or not to enable steam login.

        - `apiKey` String. [Steam API key](http://steamcommunity.com/dev/apikey) used to process logins. **Required** if `login.steam.enabled` is set to `true`.

        - `allowedIds` Array of strings. Which 64bit SteamIDs will be allowed to login.

    - `twitch` Object. Contains twitch login configuration properties.

        - `enabled` Boolean. Whether or not to enable twitch login.

        - `clientID` String. [Twitch app client ID](http://www.twitch.tv/kraken/oauth2/clients/new) **Required** if `login.twitch.enabled` is set to `true`.

        - `clientSecret` String. [Twitch app client secret](http://www.twitch.tv/kraken/oauth2/clients/new) **Required** if `login.twitch.enabled` is set to `true`.

        - `scope` Array of strings. What [permissions](https://github.com/justintv/Twitch-API/blob/master/authentication.md#scope) your Twitch app needs.

        - `allowedIds` Array of strings. Which Twitch IDs will be allowed to login.

- `logging` Object. Contains other configuration properties.

    - `console` Object. Contains properties for console logging.

        - `enabled` Boolean. Whether or not console logging is enabled.

        - `level` String. Lowest importance of messages which should be logged. Must be `"trace"`, `"debug"`, `"info"`, `"warn"` or `"error"`

    - `file` Object. Contains properties for file logging.

        - `enabled` Boolean. Whether or not file logging is enabled.

        - `path` String. File path and name to use for log file.

        - `level` String. Lowest importance of messages which should be logged. Must be `"trace"`, `"debug"`, `"info"`, `"warn"` or `"error"`

##Example
```json
{
    "host": "example.com",
    "port": 1234,
    "login": {
        "enabled": true,
        "sessionSecret": "supersecret",
        "steam": {
            "enabled": true,
            "apiKey": "YYYYY",
            "allowedIds": [
                "11111111111111111",
                "22222222222222222"
            ]
        },
        "twitch": {
            "enabled": true,
            "clientID": "your_app_id",
            "clientSecret": "your_app_key",
            "scope": "user_read",
            "allowedIds": [
                "333333333",
                "444444444"
            ]
        }
    },
    "logging": {
        "console": {
            "enabled": true,
            "level": "trace"
        },
        "file": {
            "enabled": true,
            "path": "logs/server.log",
            "level": "info"
        }
    }
}
```
