'use strict';

var tokens = require('../login/tokens');
var config = require('../config').config;

/**
 * Express middleware that checks if the user is authenticated.
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports = function (req, res, next) {
	if (!config.login.enabled) {
		return next();
	}

	// To set a cookie on localhost, domain must be "null"
	var domain = config.host === 'localhost' ? null : config.host;

	var allowed = req.user === undefined ? false : req.user.allowed;
	var provider = req.user === undefined ? 'none' : req.user.provider;
	var providerAllowed = provider === 'none' ? false : config.login[provider].enabled;

	// Cookies are populated by cookie-parser middleware in login lib.
	if (req.query.key || req.cookies.socketToken) {
		tokens.find({token: req.query.key || req.cookies.socketToken}, function (err, token) {
			if (err) {
				throw err;
			}

			if (token) {
				next();
			} else {
				// Ensure we delete the existing cookie so that it doesn't become poisoned
				// and cause an infinite login loop.
				req.session.destroy(function () {
					res.clearCookie('connect.sid', {path: '/'});
					res.clearCookie('socketToken', {path: '/'});
					res.redirect('/login');
				});
			}
		});
	} else if (req.isAuthenticated() && allowed && providerAllowed) {
		tokens.findOrCreate({provider: provider, id: req.user.id}, function (err, token) {
			if (err) {
				throw err;
			}

			res.cookie('socketToken', token, {
				path: '/',
				domain: domain,
				secure: config.ssl && config.ssl.enabled
			});

			next();
		});
	} else {
		req.session.returnTo = req.url;
		res.redirect('/login');
	}
};
