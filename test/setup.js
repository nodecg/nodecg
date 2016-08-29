/* eslint-env node, mocha, browser */
'use strict';

process.env.test = true;

// Tell NodeCG to load a blank config file, to avoid any contamination.
process.argv.push('--cfgPath');
process.argv.push('./test/specimen/test.json');

const webdriverio = require('webdriverio');
const e = require('./setup/test-environment');
const C = require('./setup/test-constants');

// Global before and after
before(function (done) {
	this.timeout(0);

	if (C.CONFIG.autodeps && (C.CONFIG.autodeps.npm === false || C.CONFIG.autodeps.bower === false)) {
		throw new Error('Autodeps disabled! ' +
			'Please enable auto-installing dependencies in cfg/nodecg.json before running tests');
	}

	if (C.CONFIG.login && C.CONFIG.login.enabled) {
		throw new Error('Login security is enabled! ' +
			'Please disable login security in cfg/nodecg.json before running tests');
	}

	if (C.CONFIG.ssl && C.CONFIG.ssl.enabled) {
		throw new Error('SSL is enabled! Please disable SSL in cfg/nodecg.json before running tests');
	}

	e.server.once('started', () => {
		/** Extension API setup **/
		e.apis.extension = e.server.getExtensions()[C.BUNDLE_NAME];

		if (process.env.TRAVIS_OS_NAME && process.env.TRAVIS_JOB_NUMBER) {
			console.log('Travis environment detected, running WebDriver.io with Travis capabilities');
			const desiredCapabilities = {
				name: `Travis job ${process.env.TRAVIS_JOB_NUMBER}`,
				build: process.env.TRAVIS_BUILD_NUMBER,
				tags: [process.env.TRAVIS_BRANCH, process.env.TRAVIS_COMMIT, process.env.TRAVIS_COMMIT_RANGE],
				browserName: 'chrome',
				chromeOptions: {
					args: ['--disable-popup-blocking']
				},
				tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
			};

			if (process.env.TRAVIS_PULL_REQUEST !== 'false') {
				desiredCapabilities.tags.push(process.env.TRAVIS_PULL_REQUEST);
			}

			if (process.env.TRAVIS_TAG) {
				desiredCapabilities.tags.push(process.env.TRAVIS_TAG);
			}

			if (process.env.TRAVIS_OS_NAME === 'linux') {
				// desiredCapabilities.platform = 'Linux';

				// Use Windows until Sauce Labs has at least Chrome 49 on Linux
				// https://saucelabs.com/platforms/#linux
				desiredCapabilities.platform = 'Windows 10';
			} else if (process.env.TRAVIS_OS_NAME === 'osx') {
				desiredCapabilities.platform = 'OS X 10.10';
			}

			e.browser.client = webdriverio.remote({
				desiredCapabilities,
				host: 'ondemand.saucelabs.com',
				port: 80,
				user: process.env.SAUCE_USERNAME,
				key: process.env.SAUCE_ACCESS_KEY
			});
		} else {
			console.log('Running WebDriver.io with local capabilities');
			e.browser.client = webdriverio.remote({
				desiredCapabilities: {
					browserName: 'chrome',
					loggingPrefs: {
						browser: 'ALL'
					}
				}
			});
		}

		e.browser.client
			.init()
			.timeouts('script', 30000)
			.newWindow(C.DASHBOARD_URL, 'NodeCG dashboard', '')
			.getCurrentTabId()
			.then(tabId => {
				e.browser.tabs.dashboard = tabId;
			})
			.executeAsync(done => {
				const checkForApi = setInterval(() => {
					if (typeof window.dashboardApi !== 'undefined') {
						clearInterval(checkForApi);
						done();
					}
				}, 50);
			})
			.newWindow(`${C.TEST_PANEL_URL}?standalone=true`, 'NodeCG test bundle standalone panel', '')
			.getCurrentTabId()
			.then(tabId => {
				e.browser.tabs.panelStandalone = tabId;
			})
			.executeAsync(done => {
				const checkForApi = setInterval(() => {
					if (typeof window.dashboardApi !== 'undefined') {
						clearInterval(checkForApi);
						done();
					}
				}, 50);
			})
			.newWindow(C.GRAPHIC_URL, 'NodeCG test bundle graphic', '')
			.getCurrentTabId()
			.then(tabId => {
				e.browser.tabs.graphic = tabId;
			})
			.executeAsync(done => {
				const checkForApi = setInterval(() => {
					if (typeof window.graphicApi !== 'undefined') {
						clearInterval(checkForApi);
						done();
					}
				}, 50);
			})
			.timeoutsAsyncScript(5000)
			.call(done);
	});
	e.server.start();
});

after(function (done) {
	e.server.stop();

	// Only end the session if running on Travis.
	// It's helpful to keep it open when running locally for debug purposes.
	if (process.env.TRAVIS_OS_NAME && process.env.TRAVIS_JOB_NUMBER) {
		this.timeout(10000);
		e.browser.client.end()
			.then(() => done())
			.catch(err => done(err));
	} else {
		done();
	}
});
