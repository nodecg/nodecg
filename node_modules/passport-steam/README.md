# Passport-Steam

[Passport](https://github.com/jaredhanson/passport) strategy for authenticating
with [Steam](http://steamcommunity.com/) using OpenID 2.0.


## Installation

```bash
$ npm install --save passport-steam
```

## Usage

#### Configure Strategy

The Steam authentication strategy authenticates users using a steam account,
which is also an OpenID 2.0 identifier.  The strategy requires a `validate`
callback, which accepts this identifier and calls `done` providing a user.
Additionally, options can be supplied to specify a return URL and realm.

```javascript
passport.use(new SteamStrategy({
    returnURL: 'http://localhost:3000/auth/steam/return',
    realm: 'http://localhost:3000/',
    apiKey: 'your steam API key'
  },
  function(identifier, profile, done) {
    User.findByOpenID({ openId: identifier }, function (err, user) {
      return done(err, user);
    });
  }
));
```

A Steam API key can be obtained at http://steamcommunity.com/dev/apikey. However if you wish not to use an API key, you can include `profile: false` into the SteamStrategy object, which will disable the fetching of user data.

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'steam'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

```javascript
app.get('/auth/steam',
  passport.authenticate('steam'),
  function(req, res) {
    // The request will be redirected to Steam for authentication, so
    // this function will not be called.
  });

app.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });
```

## Examples

### Basic example using Express

For a complete, working example, refer to the [signon example](https://github.com/liamcurry/passport-steam/tree/master/examples/signon) or follow the steps below. Do not forget to add your API key.

To run the example, you can perform the following from the command line:

1. Clone the repository

    ```git clone https://github.com/liamcurry/passport-steam.git```

2. Go into the repository

    ```cd passport-steam```

3. Download the required dependencies

    ```npm install```

4. Edit `examples/signon/app.js` with your favorite text editor
5. Update the `localhost` parameter and add your API key in this block within `examples/signon/app.js`

    ```
    returnURL: 'http://localhost:3000/auth/steam/return',
        realm: 'http://localhost:3000/',
        apiKey: 'Your API key here'
    ```

6. Save your changes to `examples/signon/app.js`
7. Start the example

    ```
    npm run example
    ```
    
8. Go to the address you put in `realm` in your browser.

### Basic example using Express with Router

For a complete, working example, refer to the [signon example](https://github.com/liamcurry/passport-steam/tree/master/examples/signon) or follow the steps below. Do not forget to add your API key.

To run the example, you can perform the following from the command line:

1. Clone the repository

    ```git clone https://github.com/liamcurry/passport-steam.git```

2. Go into the repository

    ```cd passport-steam```

3. Download the required dependencies

    ```npm install```

4. Edit `examples/signon/app-router.js` with your favorite text editor
5. Update the `localhost` parameter and add your API key in this block within `examples/signon/app-router.js`

    ```
    returnURL: 'http://localhost:3000/auth/steam/return',
        realm: 'http://localhost:3000/',
        apiKey: 'Your API key here'
    ```

6. Save your changes to `examples/signon/app-router.js`
7. Start the example

    ```
    npm run example-router
    ```
    
8. Go to the address you put in `realm` in your browser.

## Tests

If you would like to contribute, please provide accompanying tests with [AVA](https://github.com/sindresorhus/ava)

```bash
$ npm install -g ava
$ ava
```

[![Build Status](https://secure.travis-ci.org/liamcurry/passport-steam.png)](http://travis-ci.org/liamcurry/passport-steam)

## Contributors

  - [Jared Hanson](http://github.com/jaredhanson)
  - [elisee](https://github.com/elisee)
  - [welps](https://github.com/welps)
  - [mnzt](https://github.com/mnzt)
  - [scholtzm](https://github.com/scholtzm)
  - [Burnett01](https://github.com/Burnett01)

## License

(The MIT License)

Copyright (c) 2011 Jared Hanson

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
