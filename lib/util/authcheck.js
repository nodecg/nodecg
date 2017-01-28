'use strict';

const tokens = require('../login/tokens');
const config = require('../config').config;

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
	const domain = config.host === 'localhost' ? null : config.host;

	const allowed = req.user === undefined ? false : req.user.allowed;
	const provider = req.user === undefined ? 'none' : req.user.provider;
	const providerAllowed = provider === 'none' ? false : config.login[provider].enabled;

	// Cookies are populated by cookie-parser middleware in login lib.
	if (req.query.key || req.cookies.socketToken) {
		tokens.find({token: req.query.key || req.cookies.socketToken}, (err, token) => {
			if (err) {
				throw err;
			}

			if (token) {
				res.cookie('socketToken', token, {
					path: '/',
					domain,
					secure: config.ssl && config.ssl.enabled
				});

				next();
			} else {
				// Ensure we delete the existing cookie so that it doesn't become poisoned
				// and cause an infinite login loop.
				req.session.destroy(() => {
					res.clearCookie('connect.sid', {path: '/'});
					res.clearCookie('socketToken', {path: '/'});
					res.redirect('/login');
				});
			}
		});
	} else if (req.isAuthenticated() && allowed && providerAllowed) {
		tokens.findOrCreate({
			provider,
			id: req.user.id
		}, (err, token) => {
			if (err) {
				throw err;
			}

			res.cookie('socketToken', token, {
				path: '/',
				domain,
				secure: config.ssl && config.ssl.enabled
			});

			next();
		});
	} else {
		req.session.returnTo = req.url;
		res.redirect('/login');
	}
};
