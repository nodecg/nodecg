'use strict';

// Packages
const test = require('ava');

// Ours
require('./helpers/nodecg-and-webdriver')(test, ['single-insatnce']); // Must be first.
const e = require('./helpers/test-environment');

test.beforeEach(async () => {
	await e.browser.client.switchTab(e.browser.tabs.singleInstance);
});

test.cb('single-instance graphics shouldn\'t enter an infinite redirect loop when including a polymer element that loads an external stylesheet', t => {
	const singleInstance = require('../lib/graphics/single_instance');

	function cb(url) {
		if (url === '/bundles/test-bundle/graphics/single_instance.html') {
			throw new Error('The graphic must have gotten redirected.');
		}
	}

	process.nextTick(() => {
		singleInstance.once('graphicAvailable', cb);
	});

	setTimeout(() => {
		singleInstance.removeListener('graphicAvailable', cb);
		t.end();
	}, 5000);
});
