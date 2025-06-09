/**
 * Module dependencies.
 */
var passport = require('@passport-next/passport-strategy')
  , openid = require('openid')
  , util = require('util')
  , BadRequestError = require('./errors/badrequesterror')
  , InternalOpenIDError = require('./errors/internalopeniderror');


/**
 * `Strategy` constructor.
 *
 * The OpenID authentication strategy authenticates requests using the OpenID
 * 2.0 or 1.1 protocol.
 *
 * OpenID provides a decentralized authentication protocol, whereby users can
 * authenticate using their choice of OpenID provider.  Authenticating in this
 * this manner involves a sequence of events, including prompting the user to
 * enter their OpenID identifer and redirecting the user to their OpenID
 * provider for authentication.  Once authenticated, the user is redirected back
 * to the application with an assertion regarding the identifier.
 *
 * Applications must supply a `verify` callback which accepts an `identifier`,
 * an optional service-specific `profile`, an optional set of policy extensions
 * and then calls the `done` callback supplying a `user`, which should be set to 
 * `false` if the credentials are not valid.  If an exception occured, `err` 
 * should be set.
 *
 * Options:
 *   - `returnURL`         URL to which the OpenID provider will redirect the user after authentication
 *   - `realm`             the part of URL-space for which an OpenID authentication request is valid
 *   - `profile`           enable profile exchange, defaults to _false_
 *   - `pape`              when present, enables the OpenID Provider Authentication Policy Extension
 *                         (http://openid.net/specs/openid-provider-authentication-policy-extension-1_0.html)
 *   - `pape.maxAuthAge`   sets the PAPE maximum authentication age in seconds
 *   - `pape.preferredAuthPolicies` sets the preferred set of PAPE authentication policies for the 
 *                         relying party to use for example `multi-factor`, `multi-factor-physical`
 *                         or `phishing-resistant` (either an array or a string)
 *   - `identifierField`   field name where the OpenID identifier is found, defaults to 'openid_identifier'
 *   - `passReqToCallback` when `true`, `req` is the first argument to the verify callback (default: `false`)
 *
 * Examples:
 *
 *     passport.use(new OpenIDStrategy({
 *         returnURL: 'http://localhost:3000/auth/openid/return',
 *         realm: 'http://localhost:3000/'
 *       },
 *       function(identifier, done) {
 *         User.findByOpenID(identifier, function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 *     passport.use(new OpenIDStrategy({
 *         returnURL: 'http://localhost:3000/auth/openid/return',
 *         realm: 'http://localhost:3000/',
 *         profile: true,
 *         pape: { maxAuthAge : 600 } 
 *       },
 *       function(identifier, profile, done) {
 *         User.findByOpenID(identifier, function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  if (!options.returnURL) throw new Error('OpenID authentication requires a returnURL option');
  if (!verify) throw new Error('OpenID authentication strategy requires a verify callback');
  
  passport.Strategy.call(this);
  this.name = 'openid';
  this._verify = verify;
  this._profile = options.profile;
  this._pape = options.pape;
  this._passReqToCallback = options.passReqToCallback;
  
  var extensions = [];
  if (options.profile) {
    var sreg = new openid.SimpleRegistration({
      "fullname" : true,
      "nickname" : true, 
      "email" : true, 
      "dob" : true, 
      "gender" : true, 
      "postcode" : true,
      "country" : true, 
      "timezone" : true,
      "language" : true
    });
    extensions.push(sreg);
  }
  if (options.profile) {
    var ax = new openid.AttributeExchange({
      "http://axschema.org/namePerson" : "required",
      "http://axschema.org/namePerson/first": "required",
      "http://axschema.org/namePerson/last": "required",
      "http://axschema.org/contact/email": "required"
    });
    extensions.push(ax);
  }

  if (options.ui) {
    // ui: { mode: 'popup', icon: true, lang: 'fr-FR' }
    var ui = new openid.UserInterface(options.ui);
    extensions.push(ui);
  }

  if (options.pape) {
    var papeOptions = {};
    if (options.pape.hasOwnProperty("maxAuthAge")) {
      papeOptions.max_auth_age = options.pape.maxAuthAge;
	  }
    if (options.pape.preferredAuthPolicies) {
      if (typeof options.pape.preferredAuthPolicies === "string") {
        papeOptions.preferred_auth_policies = options.pape.preferredAuthPolicies;
      } else if (Array.isArray(options.pape.preferredAuthPolicies)) {
        papeOptions.preferred_auth_policies = options.pape.preferredAuthPolicies.join(" ");
      }
    }
    var pape = new openid.PAPE(papeOptions);
    extensions.push(pape);
  }
  
  if (options.oauth) {
    var oauthOptions = {};
    oauthOptions.consumerKey = options.oauth.consumerKey;
    oauthOptions.scope = options.oauth.scope;
    
    var oauth = new openid.OAuthHybrid(oauthOptions);
    extensions.push(oauth);
  }
  
  this._relyingParty = new openid.RelyingParty(
    options.returnURL,
    options.realm,
    (options.stateless === undefined) ? false : options.stateless,
    (options.secure === undefined) ? true : options.secure,
    extensions);
      
  this._providerURL = options.providerURL;
  this._identifierField = options.identifierField || 'openid_identifier';
}

/**
 * Inherit from `passport.Strategy`.
 */
util.inherits(Strategy, passport.Strategy);


/**
 * Authenticate request by delegating to an OpenID provider using OpenID 2.0 or
 * 1.1.
 *
 * @param {Object} req
 * @api protected
 */
Strategy.prototype.authenticate = function(req) {

  if (req.query && req.query['openid.mode']) {
    // The request being authenticated contains an `openid.mode` parameter in
    // the query portion of the URL.  This indicates that the OpenID Provider
    // is responding to a prior authentication request with either a positive or
    // negative assertion.  If a positive assertion is received, it will be
    // verified according to the rules outlined in the OpenID 2.0 specification.
    
    // NOTE: node-openid (0.3.1), which is used internally, will treat a cancel
    //       response as an error, setting `err` in the verifyAssertion
    //       callback.  However, for consistency with Passport semantics, a
    //       cancel response should be treated as an authentication failure,
    //       rather than an exceptional error.  As such, this condition is
    //       trapped and handled prior to being given to node-openid.
    
    if (req.query['openid.mode'] === 'cancel') { return this.fail({ message: 'OpenID authentication canceled' }); }
    
    var self = this;
    this._relyingParty.verifyAssertion(req.url, function(err, result) {
      if (err) { return self.error(new InternalOpenIDError('Failed to verify assertion', err)); }
      if (!result.authenticated) { return self.error(new Error('OpenID authentication failed')); }
      
      var profile = self._parseProfileExt(result);
      var pape = self._parsePAPEExt(result);
      var oauth = self._parseOAuthExt(result);

      function verified(err, user, info) {
        if (err) { return self.error(err); }
        if (!user) { return self.fail(info); }
        self.success(user, info);
      }
      
      
      var arity = self._verify.length;
      if (self._passReqToCallback) {
        if (arity == 6) {
          self._verify(req, result.claimedIdentifier, profile, pape, oauth, verified);
        } else if (arity == 5) {
          self._verify(req, result.claimedIdentifier, profile, pape, verified);
        } else if (arity == 4 || self._profile) {
          // self._profile check covers the case where callback uses `arguments`
          // and arity == 0
          self._verify(req, result.claimedIdentifier, profile, verified);
        } else {
          self._verify(req, result.claimedIdentifier, verified);
        }
      } else {
        if (arity == 5) {
          self._verify(result.claimedIdentifier, profile, pape, oauth, verified);
        } else if (arity == 4) {
          self._verify(result.claimedIdentifier, profile, pape, verified);
        } else if (arity == 3 || self._profile) {
          // self._profile check covers the case where callback uses `arguments`
          // and arity == 0
          self._verify(result.claimedIdentifier, profile, verified);
        } else {
          self._verify(result.claimedIdentifier, verified);
        }
      }
    });
  } else {
    // The request being authenticated is initiating OpenID authentication.  By
    // default, an `openid_identifier` parameter is expected as a parameter,
    // typically input by a user into a form.
    //
    // During the process of initiating OpenID authentication, discovery will be
    // performed to determine the endpoints used to authenticate with the user's
    // OpenID provider.  Optionally, and by default, an association will be
    // established with the OpenID provider which is used to verify subsequent
    // protocol messages and reduce round trips.
  
    var identifier = undefined;
    if (req.body && req.body[this._identifierField]) {
      identifier = req.body[this._identifierField];
    } else if (req.query && req.query[this._identifierField]) {
      identifier = req.query[this._identifierField];
    } else if (this._providerURL) {
      identifier = this._providerURL;
    }
    
    if (!identifier) { return this.fail(new BadRequestError('Missing OpenID identifier')); }

    var self = this;
    this._relyingParty.authenticate(identifier, false, function(err, providerUrl) {
      if (err || !providerUrl) { return self.error(new InternalOpenIDError('Failed to discover OP endpoint URL', err)); }
      self.redirect(providerUrl);
    });
  }
}

/** 
 * Register a function used to save associations.
 *
 * An association establishes a shared secret between a relying party and an
 * OpenID provider, which is used to verify subsequent protocol messages and
 * reduce round trips.  Registering a function allows an application to
 * implement storage of associations as necessary.
 *
 * The function accepts six arguments: `handle`, `provider`, `algorithm`,
 * `secret`, `expiresIn`, and `done` a callback to invoke when the association
 * has been saved.
 *
 * After the association has been saved, the corresponding `loadAssociation`
 * function will be used to load it when needed.
 *
 * Internally, this function makes use of `saveAssociation` in the underlying
 * node-openid module.  Refer to that for more information.  Note, however, that
 * the argument order has been modified to pass `handle` as the first argument,
 * as it is naturally the key used to later load the association.
 *
 * Examples:
 *
 *     strategy.saveAssociation(function(handle, provider, algorithm, secret, expiresIn, done) {
 *       saveAssoc(handle, provider, algorithm, secret, expiresIn, function(err) {
 *         if (err) { return done(err) }
 *         return done();
 *       });
 *     });
 *
 * References:
 *  - [Establishing Associations](http://openid.net/specs/openid-authentication-2_0.html#associations)
 *
 * @param {Function} fn
 * @return {Strategy} for chaining
 * @api public
 */
Strategy.prototype.saveAssociation = function(fn) {
  // wrap to make `handle` the first argument to `fn`.  this order is more
  // natural due to the fact that `handle` this is the "key" when subsequently
  // loading the association.
  openid.saveAssociation = function(provider, type, handle, secret, expiry, callback) {
    fn(handle, provider, type, secret, expiry, callback)
  }
  return this;  // return this for chaining
}

/** 
 * Register a function used to load associations.
 *
 * An association establishes a shared secret between a relying party and an
 * OpenID provider, which is used to verify subsequent protocol messages and
 * reduce round trips.  Registering a function allows an application to
 * implement loading of associations as necessary.
 *
 * The function accepts two arguments: `handle` and `done` a callback to invoke
 * when the association has been loaded.  `done` should be invoked with a
 * `provider`, `algorithm`, and `secret` (or `err` if an exception occurred).
 *
 * This function is used to retrieve associations previously saved with the
 * corresponding `saveAssociation` function.
 *
 * Internally, this function makes use of `loadAssociation` in the underlying
 * node-openid module.  Refer to that for more information.  Note, however, that
 * the callback is supplied with `provider`, `algorithm`, and `secret` as
 * individual arguments, rather than a single object containing them as
 * properties.
 *
 * Examples:
 *
 *     strategy.loadAssociation(function(handle, done) {
 *       loadAssoc(handle, function(err, provider, algorithm, secret) {
 *         if (err) { return done(err) }
 *         return done(null, provider, algorithm, secret)
 *       });
 *     });
 *
 * References:
 *  - [Establishing Associations](http://openid.net/specs/openid-authentication-2_0.html#associations)
 *
 * @param {Function} fn
 * @return {Strategy} for chaining
 * @api public
 */
Strategy.prototype.loadAssociation = function(fn) {
  // wrap to allow individual arguments to `done` callback.  this seems more
  // natural since these were individual arguments to the corresponding
  // `saveAssociation` function.
  openid.loadAssociation = function(handle, callback) {
    fn(handle, function(err, provider, algorithm, secret) {
      if (err) { return callback(err, null); }
      var obj = {
        provider: provider,
        type: algorithm,
        secret: secret
      }
      return callback(null, obj);
    });
  }
  return this;  // return this for chaining
}

/** 
 * Register a function used to cache discovered info.
 *
 * Caching discovered information about a provider can significantly speed up
 * the verification of positive assertions.  Registering a function allows an
 * application to implement storage of this info as necessary.
 *
 * The function accepts three arguments: `identifier` (which serves as a key to
 * the provider information), `provider` (the provider information being
 * cached), and `done` a callback to invoke when the information has been
 * stored.
 *
 * After the data has been cached, the corresponding `loadDiscoveredInfo`
 * function will be used to look it up when needed.
 *
 * This corresponds directly to the `saveDiscoveredInformation` provided by the
 * underlying node-openid module.  Refer to that for more information.
 *
 * Examples:
 *
 *     strategy.saveDiscoveredInfo(function(identifier, provider, done) {
 *       saveInfo(identifier, provider, function(err) {
 *         if (err) { return done(err) }
 *         return done();
 *       });
 *     };
 *
 * @param {Function} fn
 * @return {Strategy} for chaining
 * @api public
 */
Strategy.prototype.saveDiscoveredInfo = 
Strategy.prototype.saveDiscoveredInformation = function(fn) {
  openid.saveDiscoveredInformation = fn;
  return this;  // return this for chaining
}

/** 
 * Register a function used to load discovered info from cache.
 *
 * Caching discovered information about a provider can significantly speed up
 * the verification of positive assertions.  Registering a function allows an
 * application to implement laoding of this info as necessary.
 *
 * The function accepts two arguments: `identifier` (which serves as a key to
 * the provider information), and `done` a callback to invoke when the
 * information has been loaded.
 *
 * This function is used to retrieve data previously cached with the
 * corresponding `saveDiscoveredInfo` function.
 *
 * This corresponds directly to the `loadDiscoveredInformation` provided by the
 * underlying node-openid module.  Refer to that for more information.
 *
 * Examples:
 *
 *     strategy.loadDiscoveredInfo(function(identifier, done) {
 *       loadInfo(identifier, function(err, provider) {
 *         if (err) { return done(err) }
 *         return done();
 *       });
 *     });
 *
 * @param {Function} fn
 * @return {Strategy} for chaining
 * @api public
 */
Strategy.prototype.loadDiscoveredInfo =
Strategy.prototype.loadDiscoveredInformation = function(fn) {
  openid.loadDiscoveredInformation = fn;
  return this;  // return this for chaining
}

/**
 * Parse user profile from OpenID response.
 *
 * Profile exchange can take place via OpenID extensions, the two common ones in
 * use are Simple Registration and Attribute Exchange.  If an OpenID provider
 * supports these extensions, the parameters will be parsed to build the user's
 * profile.
 *
 * @param {Object} params
 * @api private
 */
Strategy.prototype._parseProfileExt = function(params) {
  var profile = {};
  
  // parse simple registration parameters
  profile.displayName = params['fullname'];
  profile.emails = [{ value: params['email'] }];
  
  // parse attribute exchange parameters
  profile.name = { familyName: params['lastname'],
                   givenName: params['firstname'] };
  if (!profile.displayName) {
    if (params['firstname'] && params['lastname']) {
      profile.displayName = params['firstname'] + ' ' + params['lastname'];
    }
  }
  if (!profile.emails) {
    profile.emails = [{ value: params['email'] }];
  }

  return profile;
}

Strategy.prototype._parsePAPEExt = function(params) {
  var pape = {};
  // parse PAPE parameters
  if (params['auth_policies']) {
  	pape.authPolicies = params['auth_policies'].split(' ');
  }
  if (params['auth_time']) {
    pape.authTime = new Date(params['auth_time']);
  }
  return pape;
}

Strategy.prototype._parseOAuthExt = function(params) {
  var oauth = {};
  // parse OAuth parameters
  if (params['request_token']) {
  	oauth.requestToken = params['request_token'];
  }
  return oauth;
}


/**
 * Expose `Strategy`.
 */ 
module.exports = Strategy;
