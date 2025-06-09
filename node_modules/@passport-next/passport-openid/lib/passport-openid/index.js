/**
 * Module dependencies.
 */
var openid = require('openid')
  , Strategy = require('./strategy')
  , BadRequestError = require('./errors/badrequesterror')
  , InternalOpenIDError = require('./errors/internalopeniderror');


/**
 * Expose `Strategy` directly from package.
 */
exports = module.exports = Strategy;

/**
 * Expose constructors.
 */
exports.Strategy = Strategy;

exports.BadRequestError = BadRequestError;
exports.InternalOpenIDError = InternalOpenIDError;


/**
 * Register a discovery function.
 *
 * Under most circumstances, registering a discovery function is not necessary,
 * due to the fact that the OpenID specification standardizes a discovery
 * procedure.
 *
 * When authenticating against a set of pre-approved OpenID providers, assisting
 * the discovery process with this information is an optimization that avoids
 * network requests for well-known endpoints.  It is also useful in
 * circumstances where work-arounds need to be put in place to address issues
 * with buggy OpenID providers or the underlying openid module.
 *
 * Discovery functions accept an `identifier` and `done` callback, which should
 * be invoked with a `provider` object containing `version` and `endpoint`
 * properties (or an `err` if an exception occurred).
 *
 * Example:
 *
 *     openid.discover(function(identifier, done) {
 *       if (identifier.indexOf('https://openid.example.com/id/') == 0) {
 *         var provider = {};
 *         provider.version = 'http://specs.openid.net/auth/2.0';
 *         provider.endpoint = 'https://openid.examle.com/api/auth';
 *         return done(null, provider);
 *       }
 *       return done(null, null);
 *     })
 *
 * @param {Function} fn
 * @api public
 */
exports.discover = function(fn) {
  discoverers.push(fn);
};

var discoverers = [];

/**
 * Swizzle the underlying loadDiscoveredInformation function in the openid
 * module.
 */
var loadDiscoveredInformation = openid.loadDiscoveredInformation;
openid.loadDiscoveredInformation = function(key, callback) {
  var stack = discoverers;
  (function pass(i, err, provider) {
    // an error occurred or a provider was found, done
    if (err || provider) { return callback(err, provider); }
    
    var discover = stack[i];
    if (!discover) {
      // The list of custom discovery functions has been exhausted.  Call the
      // original implementation provided by the openid module.
      return loadDiscoveredInformation(key, callback);
    }
    
    try {
      discover(key, function(e, p) { pass(i + 1, e, p); });
    } catch(e) {
      return callback(e);
    }
  })(0);
}
