# passport-discord

**Notice**: I'm no longer too active with the Discord API, and only tinker around occasionally. So, if there is anybody who would like to be more active in maintaining, I'm happy to link to your fork as the new solution to use or give project permissions on this repo.

Passport strategy for authentication with [Discord](http://discordapp.com) through the OAuth 2.0 API.

Before using this strategy, it is strongly recommended that you read through the official docs page [here](https://discord.com/developers/docs/topics/oauth2), especially about the scopes and understand how the auth works.

## Usage
`npm install passport-discord --save`

#### Configure Strategy
The Discord authentication strategy authenticates users via a Discord user account and OAuth 2.0 token(s). A Discord API client ID, secret and redirect URL must be supplied when using this strategy. The strategy also requires a `verify` callback, which receives the access token and an optional refresh token, as well as a `profile` which contains the authenticated Discord user's profile. The `verify` callback must also call `cb` providing a user to complete the authentication.

```javascript
var DiscordStrategy = require('passport-discord').Strategy;

var scopes = ['identify', 'email', 'guilds', 'guilds.join'];

passport.use(new DiscordStrategy({
    clientID: 'id',
    clientSecret: 'secret',
    callbackURL: 'callbackURL',
    scope: scopes
},
function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ discordId: profile.id }, function(err, user) {
        return cb(err, user);
    });
}));
```

#### Authentication Requests
Use `passport.authenticate()`, and specify the `'discord'` strategy to authenticate requests.

For example, as a route middleware in an Express app:

```javascript
app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), function(req, res) {
    res.redirect('/secretstuff') // Successful auth
});
```

If using the `bot` scope, the `permissions` option can be set to indicate
specific permissions your bot needs on the server ([permission codes](https://discordapp.com/developers/docs/topics/permissions)):

```javascript
app.get("/auth/discord", passport.authenticate("discord", { permissions: 66321471 }));
```

#### Refresh Token Usage
In some use cases where the profile may be fetched more than once or you want to keep the user authenticated, refresh tokens may wish to be used. A package such as `passport-oauth2-refresh` can assist in doing this.

Example:

`npm install passport-oauth2-refresh --save`

```javascript
var DiscordStrategy = require('passport-discord').Strategy
  , refresh = require('passport-oauth2-refresh');

var discordStrat = new DiscordStrategy({
    clientID: 'id',
    clientSecret: 'secret',
    callbackURL: 'callbackURL'
},
function(accessToken, refreshToken, profile, cb) {
    profile.refreshToken = refreshToken; // store this for later refreshes
    User.findOrCreate({ discordId: profile.id }, function(err, user) {
        if (err)
            return done(err);

        return cb(err, user);
    });
});

passport.use(discordStrat);
refresh.use(discordStrat);
```

... then if we require refreshing when fetching an update or something ...

```javascript
refresh.requestNewAccessToken('discord', profile.refreshToken, function(err, accessToken, refreshToken) {
    if (err)
        throw; // boys, we have an error here.
    
    profile.accessToken = accessToken; // store this new one for our new requests!
});
```


## Examples
An Express server example can be found in the `/example` directory. Be sure to `npm install` in that directory to get the dependencies.

## Credits
* Jared Hanson - used passport-github to understand passport more and kind of as a base.

## License
Licensed under the ISC license. The full license text can be found in the root of the project repository.
