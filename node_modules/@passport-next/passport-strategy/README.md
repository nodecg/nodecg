# passport-strategy

[![Build Status](https://travis-ci.org/passport-next/passport-strategy.svg?branch=master)](https://travis-ci.org/passport-next/passport-strategy)
[![Coverage Status](https://coveralls.io/repos/github/passport-next/passport-strategy/badge.svg?branch=master)](https://coveralls.io/github/passport-next/passport-strategy?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/5c6d93b9711897ef2949/maintainability)](https://codeclimate.com/github/passport-next/passport-strategy/maintainability)
[![Dependencies](https://david-dm.org/passport-next/passport-strategy.png)](https://david-dm.org/passport-next/passport-strategy)
<!--[![SAST](https://gitlab.com/passport-next/passport-strategy/badges/master/build.svg)](https://gitlab.com/passport-next/passport-strategy/badges/master/build.svg)-->

An abstract class implementing [Passport](http://passportjs.org/)'s strategy
API.

## Install

    $ npm install passport-strategy

## Usage

This module exports an abstract `Strategy` class that is intended to be
subclassed when implementing concrete authentication strategies.  Once
implemented, such strategies can be used by applications that utilize Passport
middleware for authentication.

#### Subclass Strategy

Create a new `CustomStrategy` constructor which inherits from `Strategy`:

```javascript
var util = require('util')
  , Strategy = require('passport-strategy');

function CustomStrategy(...) {
  Strategy.call(this);
}

util.inherits(CustomStrategy, Strategy);
```

#### Implement Authentication

Implement `autheticate()`, performing the necessary operations required by the
authentication scheme or protocol being implemented.

```javascript
CustomStrategy.prototype.authenticate = function(req, options) {
  // TODO: authenticate request
}
```

#### Augmented Methods
The Strategy.authenticate method is called on an instance of this Strategy that's augmented with the following action functions.  
These action functions are bound via closure the the request/response pair.  
The end goal of the strategy is to invoke *one* of these action methods, in
order to indicate successful or failed authentication, redirect to a
third-party identity provider, etc.

* [.success(user, info)](#Strategy+success)
* [.fail(challenge, status)](#Strategy+fail)
* [.redirect(url, status)](#Strategy+redirect)
* [.pass()](#Strategy+pass)
* [.error(err)](#Strategy+error)


##### strategy.success(user, info)
Authenticate `user`, with optional `info`.

Strategies should call this function to successfully authenticate a
user.  `user` should be an object supplied by the application after it
has been given an opportunity to verify credentials.  `info` is an
optional argument containing additional user information.  This is
useful for third-party authentication strategies to pass profile
details.

**Kind**: instance method of [Strategy](#Strategy)  
**Api**: public  

| Param | Type |
| --- | --- |
| user | Object | 
| info | Object | 


##### strategy.fail(challenge, status)
Fail authentication, with optional `challenge` and `status`, defaulting
to 401.

Strategies should call this function to fail an authentication attempt.

**Kind**: instance method of [Strategy](#Strategy)  
**Api**: public  

| Param | Type |
| --- | --- |
| challenge | String | 
| status | Number | 



##### strategy.redirect(url, status)
Redirect to `url` with optional `status`, defaulting to 302.

Strategies should call this function to redirect the user (via their
user agent) to a third-party website for authentication.

**Kind**: instance method of [Strategy](#Strategy)  
**Api**: public  

| Param | Type |
| --- | --- |
| url | String | 
| status | Number | 


##### strategy.pass()
Pass without making a success or fail decision.

Under most circumstances, Strategies should not need to call this
function.  It exists primarily to allow previous authentication state
to be restored, for example from an HTTP session.

**Kind**: instance method of [Strategy](#Strategy)  
**Api**: public  

##### strategy.error(err)
Internal error while performing authentication.

Strategies should call this function when an internal error occurs
during the process of performing authentication; for example, if the
user directory is not available.

**Kind**: instance method of [Strategy](#Strategy)  
**Api**: public  

| Param | Type |
| --- | --- |
| err | Error | 



## Related Modules

- [chai-passport-strategy](https://github.com/jaredhanson/chai-passport-strategy) — helpers for testing strategies with the Chai assertion library

## Tests

    $ npm install
    $ npm test

