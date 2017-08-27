process.env.test = true;
process.env.NODECG_TEST = true;

// Native
const fs = require('fs');
const path = require('path');

// Packages
const fse = require('fs-extra');
const temp = require('temp');

const tempFolder = temp.mkdirSync();
temp.track(); // Automatically track and cleanup files at exit.

fse.copySync('test/fixtures/nodecg-core/assets', path.join(tempFolder, 'assets'));
fse.copySync('test/fixtures/nodecg-core/bundles', path.join(tempFolder, 'bundles'));
fse.copySync('test/fixtures/nodecg-core/cfg', path.join(tempFolder, 'cfg'));
fse.copySync('test/fixtures/nodecg-core/db', path.join(tempFolder, 'db'));

// Tell NodeCG to look in our new temp folder for bundles, cfg, db, and assets, rather than whatever ones the user
// may have. We don't want to touch any existing user data!
process.env.NODECG_ROOT = tempFolder;

// Ours (must be after the above setup steps)
const addCustomBrowserCommands = require('./custom-webdriver-commands');
const C = require('./test-constants');
const e = require('./test-environment');

module.exports = function (test, tabs) {
	test.before(async () => {
		if (C.CONFIG.login && C.CONFIG.login.enabled) {
			throw new Error('Login security is enabled! ' +
				'Please disable login security in cfg/nodecg.json before running tests');
		}

		if (C.CONFIG.ssl && C.CONFIG.ssl.enabled) {
			throw new Error('SSL is enabled! Please disable SSL in cfg/nodecg.json before running tests');
		}

		process.env.NODECG_ROOT = tempFolder;
		await new Promise((resolve, reject) => {
			e.server.on('started', resolve);
			e.server.on('error', reject);
			e.server.start();
		});

		// Extension API setup
		e.apis.extension = e.server.getExtensions()[C.BUNDLE_NAME];

		// Only start up Selenium if the test requested some tabs.
		if (!tabs || tabs.length <= 0) {
			return;
		}

		const webdriverio = require('webdriverio');
		if (process.env.TRAVIS_OS_NAME && process.env.TRAVIS_JOB_NUMBER) {
			const isPR = process.env.TRAVIS_PULL_REQUEST !== 'false';
			if (isPR) {
				console.log('Pull request detected, running WebDriver.io with local capabilities');
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
				console.log('Travis environment detected, running WebDriver.io with Travis capabilities');
				const desiredCapabilities = {
					name: `Travis job ${process.env.TRAVIS_JOB_NUMBER}`,
					build: process.env.TRAVIS_BUILD_NUMBER,
					tags: [process.env.TRAVIS_BRANCH, process.env.TRAVIS_COMMIT, process.env.TRAVIS_COMMIT_RANGE],
					browserName: 'chrome',
					chromeOptions: {
						args: ['--disable-popup-blocking']
					},
					tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
					loggingPrefs: {
						browser: 'ALL'
					}
				};

				if (process.env.TRAVIS_TAG) {
					desiredCapabilities.tags.push(process.env.TRAVIS_TAG);
				}

				if (process.env.TRAVIS_OS_NAME === 'linux') {
					// Disabled for now: desiredCapabilities.platform = 'Linux';

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
			}
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

		await e.browser.client.init();
		await e.browser.client.timeouts('script', 30000);

		if (tabs.includes('dashboard')) {
			await e.browser.client
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
				});
		}

		if (tabs.includes('standalone')) {
			await e.browser.client
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
				});
		}

		if (tabs.includes('graphic')) {
			await e.browser.client
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
				});
		}

		if (tabs.includes('single-instance')) {
			await e.browser.client
				.newWindow(C.SINGLE_INSTANCE_URL, 'NodeCG test single instance graphic', '')
				.getCurrentTabId()
				.then(tabId => {
					e.browser.tabs.singleInstance = tabId;
				})
				.executeAsync(done => {
					const checkForApi = setInterval(() => {
						if (typeof window.singleInstanceApi !== 'undefined') {
							clearInterval(checkForApi);
							done();
						}
					}, 50);
				});
		}

		await e.browser.client.timeouts('script', 5000);
	});

	test.after.always(async () => {
		if (e.server) {
			e.server.stop();
		}

		if (e.browser && e.browser.client && typeof e.browser.client.end === 'function') {
			if (!fs.existsSync('.nyc_output')) {
				fs.mkdirSync('.nyc_output');
			}

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
