##Schema
- `host` String. The hostname of the machine running this instance of NodeCG.

- `port` Integer. The port number you'd like this instance to listen to.

- `login` Object. Contains other configuration properties.

    - `enabled` Boolean. Whether or not to enable login.

    - `sessionSecret` String. Secret key used for login sessions.

    - `steamApiKey` String. Steam API key used to process logins. **Required** if `login.enabled` is set to `true`.

    - `allowedIds` Array of strings. Which 64bit SteamIDs will be allowed to login.

- `logging` Object. Contains other configuration properties.

    - `console` Object. Contains properties for console logging.

        - `enabled` Boolean. Whether or not console logging is enabled.

        - `level` String. Lowest importance of messages which should be logged.

    - `file` Object. Contains properties for file logging.

        - `enabled` Boolean. Whether or not file logging is enabled.

        - `path` String. File path and name to use for log file.

        - `level` String. Lowest importance of messages which should be logged.

##Example
```json
{
    "host": "example.com",
    "port": 1234,
    "login": {
        "enabled": true,
        "sessionSecret": "supersecret",
        "steamApiKey": "YYYYY",
        "allowedIds": [
            "33333333333333333",
            "44444444444444444"
        ]
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
