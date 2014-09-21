#Schema
- `host` String. The hostname of the machine running this instance of NodeCG.

- `port` Integer. The port number you'd like this instance to listen to.

- `login` Object. Contains other configuration properties.

    - `enabled` Boolean. Whether or not to enable login.
    
    - `sessionSecret` String. Secret key used for login sessions.
    
    - `steamApiKey` String. Steam API key used to process logins. **Required** if `login.enabled` is set to `true`.

    - `allowedIds` Array of strings. Which 64bit SteamIDs will be allowed to login.

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
    }
}
```
