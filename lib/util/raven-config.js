'use strict';

// Ours
const bundleManager = require('../bundle-manager');
const configHelper = require('../config');
const pjson = require('../../package.json');

const {config} = configHelper;
const ravenConfigExtra = {};
const ravenConfig = {
	release: pjson.version,
	tags: {
		nodecgHost: config.host,
		nodecgBaseURL: config.baseURL
	},
	extra: ravenConfigExtra
};

// When the bundle manager first loads up the bundles, a
bundleManager.on('init', bundles => {
	ravenConfig.extra.bundles = bundles.map(bundle => {
		return {
			name: bundle.name,
			git: bundle.git,
			version: bundle.version
		};
	});
});

bundleManager.on('gitChanged', bundle => {
	const foo = ravenConfigExtra.bundles.find(data => data.name === bundle.name);
	foo.git = bundle.git;
	foo.version = bundle.version;
});

module.exports = ravenConfig;
