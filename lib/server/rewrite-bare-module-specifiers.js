'use strict';

// Native
const path = require('path');

// Packages
const contentType = require('content-type');
const LRU = require('lru-cache');
const babel = require('@babel/core');

// Ours
const transformResponse = require('./transform-middleware');

const javaScriptMimeTypes = [
	'application/javascript',
	'application/ecmascript',
	'text/javascript',
	'text/ecmascript'
];

function getContentType(response) {
	const contentTypeHeader = response.get('Content-Type');
	return contentTypeHeader && contentType.parse(contentTypeHeader).type;
}

const getCompileCacheKey = (requestPath, body) => requestPath + body;

const babelCompileCache = LRU({ // eslint-disable-line new-cap
	length: (n, key) => n.length + key.length,
	max: 52428800
});

module.exports = transformResponse({
	shouldTransform(request, response) {
		if ('nocompile' in request.query) {
			return false;
		}
		if (!javaScriptMimeTypes.includes(getContentType(response))) {
			return false;
		}
		// TODO: don't compile unless bundle has opted in
		return request.path.includes('/bundles/gdqx18-layouts/');
	},

	transform(request, response, body) {
		const cacheKey = getCompileCacheKey(request.baseUrl + request.path, body);
		const cached = babelCompileCache.get(cacheKey);
		if (cached !== undefined) {
			return cached;
		}

		const contentType = getContentType(response);

		let transformed = body;
		if (javaScriptMimeTypes.includes(contentType)) {
			transformed = babel.transformSync(body, {
				cwd: path.resolve(process.env.NODECG_ROOT, 'bundles/gdqx18-layouts'),
				filename: path.resolve(process.env.NODECG_ROOT, request.path.replace(/^\//, '')),
				plugins: [
					['bare-import-rewrite', {
						modulesDir: '/bundles/gdqx18-layouts/node_modules'
					}]
				]
			}).code;
		}
		babelCompileCache.set(cacheKey, transformed);
		return transformed;
	}
});
