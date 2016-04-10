NodeCG is configured via a `cfg/nodecg.json` file with the following schema:

### Schema
- `host` _String_ The IP address or hostname that NodeCG should bind to.
- `port` _Integer_ The port that NodeCG should listen on.
- `baseURL` _String_ The URL NodeCG will be accessed via in advanced server setups. Defaults to `host:port`.
- `login` _Object_ Contains other configuration properties.
    - `enabled` _Boolean_ Whether to enable login security.
    - `sessionSecret` _String_ The secret used to salt sessions.
    - `steam` _Object_ Contains steam login configuration properties.
        - `enabled` _Boolean_ Whether to enable Steam authentication.
        - `apiKey` _String_ A Steam API Key. Obtained from [http://steamcommunity.com/dev/apikey](http://steamcommunity.com/dev/apikey)
        - `allowedIds` _Array of strings_ Which 64 bit Steam IDs to allow. Can be obtained from [https://steamid.io/](https://steamid.io/)
    - `twitch` _Object_ Contains twitch login configuration properties.
        - `enabled` _Boolean_ Whether to enable Twitch authentication.
        - `clientID` _String_ A Twitch application ClientID [http://twitch.tv/kraken/oauth2/clients/new](http://twitch.tv/kraken/oauth2/clients/new)
        - `clientSecret` _String_ A Twitch application ClientSecret [http://twitch.tv/kraken/oauth2/clients/new](http://twitch.tv/kraken/oauth2/clients/new)
        - `scope` _String_ A space-separated string of Twitch application [permissions](https://github.com/justintv/Twitch-API/blob/master/authentication.md#scope).
        - `allowedUsernames` _Array of strings_ Which Twitch usernames to allow.
- `logging` _Object_ Contains other configuration properties.
    - `replicants` _Boolean_ Whether to enable logging of the Replicants subsystem. Very spammy.
    - `console` _Object_ Contains properties for console logging.
        - `enabled` _Boolean_ Whether to enable console logging.
        - `level` _String_ Lowest importance of messages which should be logged. Must be `"trace"`, `"debug"`, `"info"`, `"warn"` or `"error"`
    - `file` _Object_ Contains properties for file logging.
        - `enabled` _Boolean_ Whether to enable file logging.
        - `path` _String_ The filepath to log to.
        - `level` _String_ Lowest importance of messages which should be logged. Must be `"trace"`, `"debug"`, `"info"`, `"warn"` or `"error"`
- `ssl` _Object_ Contains HTTPS/SSL configuration properties.
    - `enabled` _Boolean_ Whether to enable SSL/HTTPS encryption.
    - `allowHTTP` _Boolean_ Whether to allow insecure HTTP connections while SSL is active.
    - `keyPath` _String_ The path to an SSL key file.
    - `certificatePath` _String_ The path to an SSL certificate file.
- `developer` _Boolean_ Whether to enable features that speed up development. Not suitable for production.
- `rollbar` _Object_ Contains [Rollbar](https://rollbar.com/) configuration properties. 
	- `enabled` _Boolean_ Whether to enable Rollbar error tracking.
	- `environment` _String_ An arbitrary name you choose for this environment. Something like `production`, `development`, `staging`, etc.
	- `postServerItem` _String_ Your Rollbar project's POST_SERVER_ITEM_ACCESS_TOKEN
	- `postClientItem` _String_ Your Rollbar project's POST_CLIENT_ITEM_ACCESS_TOKEN

### Example Config
```json
{
    "host": "example.com",
    "port": 9090,
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
            "allowedUsernames": [
                "some_username"
            ]
        }
    },
    "logging": {
        "replicants": false,
        "console": {
            "enabled": true,
            "level": "trace"
        },
        "file": {
            "enabled": true,
            "path": "logs/server.log",
            "level": "info"
        }
    },
    "ssl": {
        "enabled": false,
        "keyPath": "",
        "certificatePath": ""
    },
    "developer": false
}
```
