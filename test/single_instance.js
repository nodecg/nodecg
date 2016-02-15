/* eslint-env node, mocha, browser */
'use strict';

var e = require('./setup/test-environment');
var C = require('./setup/test-constants');

describe('single-instance graphics', function () {
	this.timeout(10000);

	before(function (done) {
		this.timeout(0);
		e.browser.client
			.newWindow(C.SINGLE_INSTANCE_URL, 'NodeCG test single instance graphic', '')
			.getCurrentTabId()
			.then(function (tabId) {
				e.browser.tabs.singleInstance = tabId;
				done();
			});
	});

	it('shouldn\'t enter an infinite redirect loop when including a polymer element that loads an external stylesheet',
		function (done) {
			var singleInstance = require('../lib/graphics/single_instance');

			singleInstance.once('graphicAvailable', cb);

			function cb(url) {
				if (url === '/graphics/test-bundle/single_instance.html') {
					throw new Error('The graphic must have gotten redirected.');
				}
			}

			setTimeout(function () {
				singleInstance.removeListener('graphicAvailable', cb);
				done();
			}, 5000);
		});
});
