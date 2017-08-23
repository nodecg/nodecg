'use strict';

// Packages
const test = require('ava');

// Ours
require('./helpers/nodecg-and-webdriver')(test); // Must be first.
const e = require('./helpers/test-environment');
const C = require('./helpers/test-constants');

test.beforeEach(async () => {
	await e.browser.client.newWindow(C.SINGLE_INSTANCE_URL, 'NodeCG test single instance graphic', '');
	e.browser.tabs.singleInstance = await e.browser.client.getCurrentTabId();
	return e.browser.client.executeAsync(done => {
		const checkForApi = setInterval(() => {
			if (typeof window.singleInstanceApi !== 'undefined') {
				clearInterval(checkForApi);
				done();
			}
		}, 50);
	});
});

test.cb('single-instance graphics shouldn\'t enter an infinite redirect loop when including a polymer element ' +
	'that loads an external stylesheet', t => {
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
