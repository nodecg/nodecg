- [Is NodeCG secure by default?](#insecure-by-default)
- [What levels of authorization does NodeCG have?](#auth-levels)
- [How are users authorized?](#auth-mechanics)
- [What do I do if one of my keys got leaked?](#leak-response)
- [How do I enable login security?](#enabling-login-security)
  - [Local Auth](#local-auth)
  - [Twitch Auth](#twitch-auth)
  - [Discord Auth](#discord-auth)
  - [Steam Auth](#steam-auth)
- [How do I enable HTTPS/SSL encryption?](#enabling-https)

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
NodeCG has support for four authentication providers:
  - [Local Username/Password Auth](#local-auth)
  - [Twitch Auth](#twitch-auth)
  - [Discord Auth](#discord-auth)
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

Local authentication also support password hashing by using HMAC. In order to use a password hash, fill the `password` property with the format `<type>:<hash>` where `<type>` is the type (SHA-256, RIPEMD, Whirlpool, ...) and `<hash>` a valid password hash.

For generating a valid password hash, you must use `sessionSecret` as secret key.
If you're looking for a HMAC hash generator, you can use tools like [wtools.io](https://wtools.io/generate-hmac-hash) for example.

Currently, only native Node.js algorithms are supported.

Example:

```json
{
  "login": {
    "enabled": true,
    "sessionSecret": "Make this a random string, like one from https://randomkeygen.com/",
    "local": {
      "enabled": true,
      "allowedUsers": [
        {
          "username": "admin",
          "password": "sha256:ac679e332d4eee340b74eb0581225686f2736d58df7ea30c87a0d2cd5bfd1329"
        },
        {
          "username": "other_admin",
          "password": "ripemd:6f00f0c4c18fb563921b689876e98b61"
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

### <a name="discord-auth"></a> Discord Auth
1. [Create a new application on your Discord Developer Dashboard](https://discord.com/developers/applications)
2. Give it whatever value you want for the Name
3. Click on OAuth2 on the left and Set the OAuth Redirect URL to `https://YOUR_DEPLOYMENT_URL/login/auth/discord`.
  - If you're testing locally, use `http://localhost:9090/login/auth/discord`
4. Use the Client ID and Client Secret from general information for your configuration
5. Configure your `nodecg/cfg/nodecg.json` like below
  - See the [Discord docs for the list of available scopes](https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes).

You can use two different kinds of authentication, by user or by server.
You can use one of them or both (in which case matching one of them will grant access).
#### By user
To get a Discord user ID, enable Discord developer mode and then right click on a user to copy it.
```json
{
  "login": {
    "enabled": true,
    "sessionSecret": "Make this a random string, like one from https://randomkeygen.com/",
    "discord": {
      "enabled": true,
      "clientID": "YOUR_DISCORD_APP_CLIENT_ID",
      "clientSecret": "YOUR_DISCORD_APP_CLIENT_SECRET",
      "scope": "identify",
      "allowedIDs": [
        "paste discord user ids you want to allow here",
        "they look like this",
        "159600065017675778",
        "54561421005950976"
      ]
    }
  }
}
```
#### By Server (Guild)
To get a Discord server ID, enable Discord developer mode and then right click on a server to copy it.
Any user in the server will be allowed to use nodecg.

You can also require users in the server to additionally have certain permissions (for example administrator).
Get a list of permissions from the [Discord Docs](https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags)
```json
{
  "login": {
    "enabled": true,
    "sessionSecret": "Make this a random string, like one from https://randomkeygen.com/",
    "discord": {
      "enabled": true,
      "clientID": "YOUR_DISCORD_APP_CLIENT_ID",
      "clientSecret": "YOUR_DISCORD_APP_CLIENT_SECRET",
      "scope": "identify guilds",
      "allowedGuildIDs": [
        "paste discord server ids you want to allow here",
        "754749209722486814"
      ],
      "guildRequiredPermissions": [
        "this is optional",
        "paste permissions here to require them in the target servers",
        "permissions look like this",
        "MANAGE_MESSAGES",
        "PRIORITY_SPEAKER"
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

## <a name="enabling-https"></a> How do I enable HTTPS/SSL encryption?
1. Create an SSL certificate if you don't already have one.
  - Creating an SSL cert is out of the scope of this tutorial. You may need to do some Googling if you are unfamiliar with this process.
2. Configure your `nodecg/cfg/nodecg.json` as such (passphrase is only required if you created your key with one):
3. Restart NodeCG, and confirm that your instance is accessible via HTTPS.

```json
{
    "ssl": {
        "enabled": true,
        "keyPath": "C:\\example\\path\\your-cert-key.key",
        "certificatePath": "C:\\example\\path\\your-cert.crt",
        "passphrase": "this is my example passphrase"
	}
}
```
