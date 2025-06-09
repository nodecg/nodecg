# passport-twitch-helix
Twitch is a trademark or registered trademark of Twitch Interactive, Inc. in the U.S. and/or other countries. "passport-twitch-helix" is not operated by, sponsored by, or affiliated with Twitch Interactive, Inc. in any way.

[Passport](http://passportjs.org/) strategies for authenticating with [Twitch](http://www.twitch.tv/)
using OAuth 2.0.

This module lets you authenticate using Twitch in your Node.js applications.
By plugging into Passport, Twitch authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install
```bash
$ npm install passport-twitch-helix
```
## Usage of OAuth 2.0

#### Configure Strategy

The Twitch OAuth 2.0 authentication strategy authenticates users using a Twitch
account and OAuth 2.0 tokens. The strategy requires a `verify` callback, which
accepts these credentials and calls `done` providing a user, as well as
`options` specifying a client ID, client secret, and callback URL.

```javascript
var passport       = require("passport");
var twitchStrategy = require("passport-twitch-helix").Strategy;

passport.use(new twitchStrategy({
    clientID: TWITCH_CLIENT_ID,
    clientSecret: TWITCH_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/twitch/callback",
    scope: "user_read:email analytics:read:games"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ twitchId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));
```

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `"twitch"` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```javascript
app.get("/auth/twitch", passport.authenticate("twitch"));
app.get("/auth/twitch/callback", passport.authenticate("twitch", { failureRedirect: "/" }), function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
});
```

Optionally, the `forceVerify` option can be set to `true` to indicate
that the user should be re-prompted for authorization:

```javascript
app.get("/auth/twitch", passport.authenticate("twitch", {forceVerify: true}));
```

## Example

```javascript
var express        = require("express");
var bodyParser     = require("body-parser");
var cookieParser   = require("cookie-parser");
var cookieSession  = require("cookie-session");
var passport       = require("passport");
var twitchStrategy = require("passport-twitch-helix").Strategy;

var app = express();

app.set("views", "./views");
app.set("view engine", "ejs");

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({secret:"somesecrettokenhere"}));
app.use(passport.initialize());
app.use(express.static("./public"));

passport.use(new twitchStrategy({
    clientID: "098f6bcd4621d373cade4e832627b4f6",
    clientSecret: "4eb20288afaed97e82bde371260db8d8",
    callbackURL: "http://127.0.0.1:3000/auth/twitch/callback",
    scope: "user:read:email analytics:read:games"
  },
  function(accessToken, refreshToken, profile, done) {
    // Suppose we are using mongo..
    User.findOrCreate({ twitchId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

app.get("/", function (req, res) {
    res.render("index");
});

app.get("/auth/twitch", passport.authenticate("twitch"));
app.get("/auth/twitch/callback", passport.authenticate("twitch", { failureRedirect: "/" }), function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
});

app.listen(3000);
```

## License

The MIT License (MIT)

Copyright (c) 2015 Schmoopiie

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
