# Passport-OpenID

[Passport](https://github.com/passport-next/passport) strategy for authenticating
with [OpenID](http://openid.net/).

This module lets you authenticate using OpenID in your Node.js applications.  By
plugging into Passport, OpenID authentication can be easily and unobtrusively
integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

[![NPM version](https://img.shields.io/npm/v/@passport-next/passport-openid.svg)](https://www.npmjs.com/package/@passport-next/passport-openid)
[![Build Status](https://travis-ci.org/passport-next/passport-openid.svg?branch=master)](https://travis-ci.org/passport-next/passport-openid)
[![Coverage Status](https://coveralls.io/repos/github/passport-next/passport-openid/badge.svg?branch=master)](https://coveralls.io/github/passport-next/passport-openid?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/f278170402b42c88db23/maintainability)](https://codeclimate.com/github/passport-next/passport-openid/maintainability)
[![Dependencies](https://david-dm.org/passport-next/passport-openid.png)](https://david-dm.org/passport-next/passport-openid)
<!--[![SAST](https://gitlab.com/passport-next/passport-openid/badges/master/build.svg)](https://gitlab.com/passport-next/passport-openid/badges/master/build.svg)-->


## Install

    $ npm install @passport-next/passport-openid

## Usage

#### Configure Strategy

The OpenID authentication strategy authenticates users using an OpenID
identifier.  The strategy requires a `validate` callback, which accepts this
identifier and calls `done` providing a user.  Additionally, options can be
supplied to specify a return URL and realm.

    passport.use(new OpenIDStrategy({
        returnURL: 'http://localhost:3000/auth/openid/return',
        realm: 'http://localhost:3000/'
      },
      function(identifier, done) {
        User.findByOpenID({ openId: identifier }, function (err, user) {
          return done(err, user);
        });
      }
    ));

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'openid'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

    app.post('/auth/openid',
      passport.authenticate('openid'));

    app.get('/auth/openid/return', 
      passport.authenticate('openid', { failureRedirect: '/login' }),
      function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
      });
      
#### Saving Associations

Associations between a relying party and an OpenID provider are used to verify
subsequent protocol messages and reduce round trips.  In order to take advantage
of this, an application must store these associations.  This can be done by
registering functions with `saveAssociation` and `loadAssociation`.

    strategy.saveAssociation(function(handle, provider, algorithm, secret, expiry_time_in_seconds, done) {
      // custom storage implementation
      saveAssoc(handle, provider, algorithm, secret, expiresIn, function(err) {
        if (err) { return done(err) }
        return done();
      });
    });

    strategy.loadAssociation(function(handle, done) {
      // custom retrieval implementation
      loadAssoc(handle, function(err, provider, algorithm, secret) {
        if (err) { return done(err) }
        return done(null, provider, algorithm, secret)
      });
    });

For more information about associations, see the [documentation in node-openid](https://github.com/havard/node-openid#storing-association-state).

## Examples

For a complete, working example, refer to the [signon example](https://github.com/passport-next/passport-openid/tree/master/examples/signon).

## Tests

    $ npm install --dev
    $ make test

