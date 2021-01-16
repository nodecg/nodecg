NodeCG is configured via a `cfg/nodecg.json` file with the following schema:

### Schema
- `host` _String_ The IP address or hostname that NodeCG should bind to.
- `port` _Integer_ The port that NodeCG should listen on.
- `baseURL` _String_ The URL of this instance. Used for things like cookies. Defaults to HOST:PORT. If you use a reverse proxy, you\'ll likely need to set this value.
- `developer` _Boolean_ Whether to enable features that speed up development. Not suitable for production.
- `exitOnUncaught` _Boolean_ Whether or not to exit on uncaught exceptions.
- `logging` _Object_ Contains other configuration properties.
  - `replicants` _Boolean_ Whether to enable logging of the Replicants subsystem. Very spammy.
  - `console` _Object_ Contains properties for console logging.
    - `enabled` _Boolean_ Whether to enable console logging.
    - `level` _String_ Lowest importance of messages which should be logged. Must be `"trace"`, `"debug"`, `"info"`, `"warn"` or `"error"`
  - `file` _Object_ Contains properties for file logging.
    - `enabled` _Boolean_ Whether to enable file logging.
    - `path` _String_ The filepath to log to.
    - `level` _String_ Lowest importance of messages which should be logged. Must be `"trace"`, `"debug"`, `"info"`, `"warn"` or `"error"`
- `bundles` _Object_ Contains configuration for bundles.
  - `enabled` _Array of strings_ A whitelist array of bundle names that will be the only ones loaded at startup. Cannot be used with `bundles.disabled`.
  - `disabled` _Array of strings_ A blacklist array of bundle names that will not be loaded at startup. Cannot be used with `bundles.enabled`.
  - `paths` _Array of strings_ An array of additional paths where bundles are located.
- `login` _Object_ Contains other configuration properties.
  - `enabled` _Boolean_ Whether to enable login security.
  - `sessionSecret` _String_ The secret used to salt sessions.
  - `forceHttpsReturn` _Boolean_ orces Steam & Twitch login return URLs to use HTTPS instead of HTTP. Useful in reverse proxy setups.
  - `local` _Object_ Contains local username & password login configuration properties.
    - `enabled` _Boolean_ Whether to enable Local authentication.
    - `allowedUsers` _Array of objects_ Which usernames and passwords to allow. Example: `{"username": "admin", "password": "foo123"}`
  - `steam` _Object_ Contains steam login configuration properties.
    - `enabled` _Boolean_ Whether to enable Steam authentication.
    - `apiKey` _String_ A Steam API Key. Obtained from [http://steamcommunity.com/dev/apikey](http://steamcommunity.com/dev/apikey)
    - `allowedIds` _Array of strings_ Which 64 bit Steam IDs to allow. Can be obtained from [https://steamid.io/](https://steamid.io/)
  - `twitch` _Object_ Contains twitch login configuration properties.
    - `enabled` _Boolean_ Whether to enable Twitch authentication.
    - `clientID` _String_ A Twitch application ClientID [http://twitch.tv/kraken/oauth2/clients/new](http://twitch.tv/kraken/oauth2/clients/new)
    - `clientSecret` _String_ A Twitch application ClientSecret [http://twitch.tv/kraken/oauth2/clients/new](http://twitch.tv/kraken/oauth2/clients/new)
    - _Note:_ Configure your Twitch OAuth credentials with a Redirect URI to `{baseURL}/login/auth/twitch`
    - `scope` _String_ A space-separated string of Twitch application [permissions](https://dev.twitch.tv/docs/authentication/#scopes).
    - `allowedUsernames` _Array of strings_ Which Twitch usernames to allow.
  - `discord` _Object_ Contains discord login configuration properties.
    - `enabled` _Boolean_ Whether to enable Discord authentication.
    - `clientID` _String_ A Discord application ClientID  [https://discord.com/developers/applications/](https://discord.com/developers/applications/)
    - `clientSecret` _String_ A Discord application ClientSecret [https://discord.com/developers/applications/](https://discord.com/developers/applications/)
    - _Note:_ Configure your Discord OAuth credentials with a Redirect URI to `{baseURL}/login/auth/discord`
    - `scope` _String_ A space-separated string of Discord application [permissions](https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes).
    - `allowedUserIDs` _Array of strings_ Which Discord IDs to allow
    - `allowedGuildIDs` _Array of strings_ Users in these Discord Guilds are allowed to login
    - `guildRequiredPermissions` _Array of strings_ In addition to being in one of allowedGuildIDs, the user must have these [permissions](https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags) in the guild.
- `ssl` _Object_ Contains HTTPS/SSL configuration properties.
    - `enabled` _Boolean_ Whether to enable SSL/HTTPS encryption.
    - `allowHTTP` _Boolean_ Whether to allow insecure HTTP connections while SSL is active.
    - `keyPath` _String_ The path to an SSL key file.
    - `certificatePath` _String_ The path to an SSL certificate file.
    - `passphrase` _String_ The passphrase for the provided key file.
- `sentry` _Object_ Contains [Sentry](https://sentry.io/support-class/) configuration properties.
	- `enabled` _Boolean_ Whether to enable Sentry error reporting.
	- `dsn` _String_ Your private DSN, for server-side error reporting.
	- `publicDsn` _String_ Your public sentry DSN, for browser error reporting.

### Example Config
```json
{
    "host": "0.0.0.0",
    "port": 9090,
    "developer": false,
    "bundles": {
        "enabled": [
            "bundle-name"
        ],
        "paths": [
            "C:\\nodecg\\experimental-bundles"
        ]
    },
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
        },
        "discord": {
            "enabled": true,
            "clientID": "your_discord_app_client_id",
            "clientSecret": "your_discord_app_client_secret",
            "scope": "identify guilds",
            "allowedUserIDs": [
              "159600065017675778",
              "54561421005950976"
            ],
            "allowedGuildIDs": [
                "754749209722486814"
            ],
            "guildRequiredPermissions": [
                "MANAGE_MESSAGES",
                "PRIORITY_SPEAKER"
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
    "sentry": {
        "enabled": true,
        "dsn": "https://xxx:yyy@sentry.io/zzz",
        "publicDsn": "https://xxx@sentry.io/zzz"
    }
}
```
