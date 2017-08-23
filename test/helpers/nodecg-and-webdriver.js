process.env.test = true;
process.env.NODECG_TEST = true;

// Native
const fs = require('fs');
const path = require('path');

// Packages
const fse = require('fs-extra');
const getPort = require('get-port');
const temp = require('temp');
const webdriverio = require('webdriverio');

const tempFolder = temp.mkdirSync();
temp.track(); // Automatically track and cleanup files at exit.

fse.copySync('test/fixtures/assets', path.join(tempFolder, 'assets'));
fse.copySync('test/fixtures/bundles', path.join(tempFolder, 'bundles'));
fse.copySync('test/fixtures/cfg', path.join(tempFolder, 'cfg'));
fse.copySync('test/fixtures/db', path.join(tempFolder, 'db'));

// Tell NodeCG to look in our new temp folder for bundles, cfg, db, and assets, rather than whatever ones the user
// may have. We don't want to touch any existing user data!
process.env.NODECG_ROOT = tempFolder;

// Ours (must be after the above setup steps)
const addCustomBrowserCommands = require('./custom-webdriver-commands');
const C = require('./test-constants');
const e = require('./test-environment');

module.exports = function (test) {
	test.before(async () => {
		if (C.CONFIG.login && C.CONFIG.login.enabled) {
			throw new Error('Login security is enabled! ' +
				'Please disable login security in cfg/nodecg.json before running tests');
		}

		if (C.CONFIG.ssl && C.CONFIG.ssl.enabled) {
			throw new Error('SSL is enabled! Please disable SSL in cfg/nodecg.json before running tests');
		}

		const port = await getPort();
		process.env.NODECG_TEST_PORT = port;
		process.env.NODECG_ROOT = tempFolder;

		e.server.start({portOverride: port});

		// Extension API setup
		e.apis.extension = e.server.getExtensions()[C.BUNDLE_NAME];

		if (process.env.TRAVIS_OS_NAME && process.env.TRAVIS_JOB_NUMBER) {
			console.log('Travis environment detected, running WebDriver.io with Travis capabilities');
			e.browser.client = webdriverio.remote({
				desiredCapabilities: {
					browserName: 'chrome',
					chromeOptions: {
						args: ['--no-sandbox']
					},
					loggingPrefs: {
						browser: 'ALL'
					}
				}
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

		// Attach our custom methods to this browser instance.
		addCustomBrowserCommands(e.browser.client);

		return e.browser.client
			.init()
			.timeouts('script', 30000)
			.newWindow(C.DASHBOARD_URL, 'NodeCG dashboard', '')
			.getCurrentTabId()
			.then(tabId => {
				e.browser.tabs.dashboard = tabId;
			})
			.executeAsync(done => {
				/* eslint-disable no-undef */
				const checkForApi = setInterval(() => {
					if (typeof window.dashboardApi !== 'undefined' && typeof Polymer !== 'undefined') {
						clearInterval(checkForApi);
						Polymer.RenderStatus.afterNextRender(this, () => {
							done();
						});
					}
				}, 50);
				/* eslint-enable no-undef */
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
			.timeouts('script', 5000);
	});

	test.after.always(async () => {
		if (e.server) {
			e.server.stop();
		}

		if (e.browser && e.browser.client && typeof e.browser.client.end === 'function') {
			/* eslint-disable no-await-in-loop */
			for (const tabName in e.browser.tabs) {
				if (!{}.hasOwnProperty.call(e.browser.tabs, tabName)) {
					continue;
				}

				await e.browser.client.switchTab(e.browser.tabs[tabName]);
				const {value: coverageObj} = await e.browser.client.execute('return window.__coverage__;');

				const newCoverageObj = {};
				for (const key in coverageObj) {
					if (!{}.hasOwnProperty.call(e.browser.tabs, tabName)) {
						continue;
					}

					const absKey = path.resolve('src', key);
					coverageObj[key].path = absKey;
					newCoverageObj[absKey] = coverageObj[key];
				}

				fs.writeFileSync(`.nyc_output/browser-${tabName}.json`, JSON.stringify(newCoverageObj), 'utf-8');
			}
			/* eslint-enable no-await-in-loop */

			return e.browser.client.end();
		}
	});
};
