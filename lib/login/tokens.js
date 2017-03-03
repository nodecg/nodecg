'use strict';

const path = require('path');
const extend = require('extend');
const UnauthorizedError = require('./UnauthorizedError');
const uuid = require('uuid').v4;
const Datastore = require('nedb');
const db = new Datastore({
	filename: path.join(process.env.NODECG_ROOT, '/db/tokens.db'),
	autoload: true
});
db.persistence.setAutocompactionInterval(15 * 60 * 1000);

function authorize(options) {
	const defaults = {
		success(data, accept) {
			if (data.request) {
				accept();
			} else {
				accept(null, true);
			}
		},
		fail(error, data, accept) {
			if (data.request) {
				accept(error);
			} else {
				accept(null, false);
			}
		}
	};

	const auth = extend(defaults, options);

	return function (data, accept) {
		let token;
		let error;
		const req = data.request || data;
		const authorizationHeader = (req.headers || {}).authorization;

		if (authorizationHeader) {
			const parts = authorizationHeader.split(' ');
			if (parts.length === 2) {
				const scheme = parts[0];
				const credentials = parts[1];

				if (/^Bearer$/i.test(scheme)) {
					token = credentials;
				}
			} else {
				error = new UnauthorizedError('credentials_bad_format', {
					message: 'Format is Authorization: Bearer [token]'
				});
				return auth.fail(error, data, accept);
			}
		}

		// Get the token from query string.
		if (req._query && req._query.token) {
			token = req._query.token;
		} else if (req.query && req.query.token) {
			token = req.query.token;
		}

		if (!token) {
			error = new UnauthorizedError('credentials_required', {
				message: 'No authorization token was found'
			});
			return auth.fail(error, data, accept);
		}

		db.findOne({token}, (err, doc) => {
			if (err) {
				error = new UnauthorizedError('internal_error', err);
				return auth.fail(error, data, accept);
			}

			if (!doc || !doc.token) {
				error = new UnauthorizedError('invalid_token', 'Token could not be found');
				return auth.fail(error, data, accept);
			}

			data.token = token;
			auth.success(data, accept);
		});
	};
}

// Attempt to find an existing token for the provided search parmeters.
// If found, return that token.
// If not, make a new token (just a uuid string).
function findOrCreate(params, cb) {
	if (typeof cb !== 'function') {
		throw new Error('Callback must be a function');
	}

	db.findOne(params, (err, doc) => {
		if (err) {
			cb(err);
			return;
		}

		if (doc) {
			cb(null, doc.token);
		} else {
			params.token = uuid();
			db.insert(params, (err, newDoc) => {
				if (err) {
					cb(err);
					return;
				}

				cb(null, newDoc.token);
			});
		}
	});
}

function find(params, cb) {
	if (typeof cb !== 'function') {
		throw new Error('Callback must be a function');
	}

	db.findOne(params, (err, doc) => {
		if (err) {
			cb(err);
			return;
		}

		cb(null, doc ? doc.token : null);
	});
}

function regenerate(token, cb) {
	const newToken = uuid();
	cb = cb || function () {};
	db.update({token}, {token: newToken}, (err, numReplaced) => {
		if (err) {
			cb(err);
			return;
		}

		if (numReplaced <= 0) {
			cb(new Error(`Could not find existing token ${token}`));
			return;
		}

		cb(null, newToken);
	});
}

module.exports.findOrCreate = findOrCreate;
module.exports.find = find;
module.exports.authorize = authorize;
module.exports.regenerate = regenerate;
