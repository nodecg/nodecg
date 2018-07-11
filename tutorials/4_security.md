- [Is NodeCG secure by default?](#insecure-by-default)
- [What levels of authorization does NodeCG have?](#auth-levels)
- [How are users authorized?](#auth-mechanics)
- [What do I do if one of my keys got leaked?](#leak-response)
- [How do I enable login security?](#enabling-login-security)
  - [Local Auth](#local-auth)
  - [Twitch Auth](#twitch-auth)
  - [Steam Auth](#steam-auth)

## <a name="insecure-by-default"></a> Is NodeCG secure by default?
**No.** By default, NodeCG has no authorization or authentication of any kind. To enable basic authentication, see the [How do I enable login security?](#enabling-login-security) section.

**Do not** put an unsecured NodeCG instance on the internet or a public network. Unsecured instances should only be used for local development and on trusted LANs.

## <a name="auth-levels"></a> What levels of authorization does NodeCG have?
NodeCG has a fairly naive permissions model. There are only two permission levels:

1. Completely unauthorized, with no access to anything
2. Completely authorized, with full access to everything

This is something we want to improve in the future, but right now this is how things are in NodeCG.

"Full access to everything" includes:
- Read/write access to every Replicant in every bundle
- Read/write access to every message in every bundle
- Read access to the full config of every bundle
  - Your bundle configs may include sensitive API keys and passwords. Every user of your NodeCG deployment will have full access to these config values.
  
Therefore, untrusted users must never be given any degree of authorization in your NodeCG instance. They must never be allowed to successfully authenticate with the socket server. If they do, they will have full control over your entire NodeCG instance.
  
## <a name="auth-mechanics"></a> How are users authorized?
NodeCG has two ways of authorizing a user:
1. Reading the value of their `socketToken` cookie.
2. Reading the value of their `key` URL query parameter.
    - This is why the "COPY URL" buttons on the "Graphics" tab of the dashboard include a `?key=YOUR_KEY` at the end of them. It is necessary for the pages to load successfully in OBS.
  
Anyone who gets sent a link which includes a `key` will have full authorization and access to your NodeCG instance. Treat these links with the same secrecy as you would a password, because that's essentially what they are.


## <a name="leak-response"></a> What do I do if one of my keys got leaked?
1. Have the owner of the leaked key navigate to the "Settings" tab on the Dashboard.
2. Click "RESET KEY", and accept the confirmation dialog.

If you are unable to reach the owner of the leaked key:
1. Shutdown your NodeCG instance.
2. Locate the `nodecg/db/tokens.db` file.
3. Either completely delete this file (which will log out every user and reset their keys), or edit out the specific line containing the key which was leaked.
4. Restart NodeCG.

## <a name="enabling-login-security"></a> How do I enable login security?
NodeCG has support for three authentication providers:
  - [Local Username/Password Auth](#local-auth)
  - [Twitch Auth](#twitch-auth)
  - [Steam Auth](#steam-auth)
  
You may have multiple authentication providers enabled simultaneously.
 
### <a name="local-auth"></a> Local Auth
Configure your `nodecg/cfg/nodecg.json` as such:

```json
{
  "login": {
    "enabled": true,
    "sessionSecret": "Make this a random string, like one from https://randomkeygen.com/",
    "local": {
      "enabled": true,
      "allowedUsers": [
        {
          "username": "example1",
          "password": "password_example"
        },
        {
          "username": "example2",
          "password": "anotherExample-password1234"
        }
      ]
    }
  }
}
```

### <a name="twitch-auth"></a> Twitch Auth
1. [Create a new application on your Twitch Developer Dashboard](https://glass.twitch.tv/console/apps/create)
2. Give it whatever values you want for Name, Category, and Other Details
3. Set the OAuth Redirect URL to `https://YOUR_DEPLOYMENT_URL/login/auth/twitch`.
    - If you're testing locally, use `http://localhost:9090/login/auth/twitch`
4. Save your Client ID for the next step
5. Click "New Secret", and save your client secret for the next step
6. Configure your `nodecg/cfg/nodecg.json` as such:
    - See the [Twitch Dev docs for the list of available scopes](https://dev.twitch.tv/docs/authentication/#scopes).

```json
{
  "login": {
    "enabled": true,
    "sessionSecret": "Make this a random string, like one from https://randomkeygen.com/",
    "twitch": {
      "enabled": true,
      "clientID": "YOUR_TWITCH_APP_CLIENT_ID",
      "clientSecret": "YOUR_TWITCH_APP_CLIENT_SECRET",
      "scope": "user:read:email",
      "allowedUsernames": [
        "your_twitch_username",
        "other_twitch_username",
        "can_have_as_many_as_you_want"
      ]
    }
  }
}
```

### <a name="steam-auth"></a> Steam Auth
1. [Create/copy your Steam Web API Key](https://steamcommunity.com/dev/apikey)
2. Obtain the SteamID64 string for each of the accounts you wish to allow.
    - https://steamid.io/ is one tool for looking these up.
3. Configure your `nodecg/cfg/nodecg.json` as such:

```json
{
  "login": {
    "enabled": true,
    "sessionSecret": "Make this a random string, like one from https://randomkeygen.com/",
    "steam": {
      "enabled": true,
      "apiKey": "YOUR_STEAM_WEB_API_KEY",
      "allowedIds": [
        "paste the SteamId64s you want to allow here",
        "they look like this",
        "76561197974943998"
      ]
    }
  }
}
```
