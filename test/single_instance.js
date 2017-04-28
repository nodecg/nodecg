/* eslint-env node, mocha, browser */
'use strict';

const e = require('./setup/test-environment');
const C = require('./setup/test-constants');

describe('single-instance graphics', function () {
	this.timeout(10000);

	before(function (done) {
		this.timeout(0);
		e.browser.client
			.newWindow(C.SINGLE_INSTANCE_URL, 'NodeCG test single instance graphic', '')
			.getCurrentTabId()
			.then(tabId => {
				e.browser.tabs.singleInstance = tabId;
				done();
			});
	});

	it('shouldn\'t enter an infinite redirect loop when including a polymer element that loads an external stylesheet',
		done => {
			const singleInstance = require('../lib/graphics/single_instance');
			singleInstance.once('graphicAvailable', cb);

			function cb(url) {
				if (url === '/bundles/test-bundle/graphics/single_instance.html') {
					throw new Error('The graphic must have gotten redirected.');
				}
			}

			setTimeout(() => {
				singleInstance.removeListener('graphicAvailable', cb);
				done();
			}, 5000);
		});
});
