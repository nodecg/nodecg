process.env.test = true;
process.env.NODECG_TEST = true;

// Native
const fs = require('fs');
const path = require('path');

// Packages
const fse = require('fs-extra');
const temp = require('temp');

const tabIdsSet = new Set();
const tempFolder = temp.mkdirSync();
temp.track(); // Automatically track and cleanup files at exit.

// Tell NodeCG to look in our new temp folder for bundles, cfg, db, and assets, rather than whatever ones the user
// may have. We don't want to touch any existing user data!
process.env.NODECG_ROOT = tempFolder;

// Ours
const addCustomBrowserCommands = require('./custom-webdriver-commands');

module.exports = function (test, {tabs, nodecgConfigName = 'nodecg.json'} = {}) {
	fse.copySync('test/fixtures/nodecg-core/assets', path.join(tempFolder, 'assets'));
	fse.copySync('test/fixtures/nodecg-core/bundles', path.join(tempFolder, 'bundles'));
	fse.copySync('test/fixtures/nodecg-core/cfg', path.join(tempFolder, 'cfg'));
	fse.copySync(`test/fixtures/nodecg-core/cfg/${nodecgConfigName}`, path.join(tempFolder, 'cfg/nodecg.json'));
	fse.copySync('test/fixtures/nodecg-core/db', path.join(tempFolder, 'db'));

	const C = require('./test-constants');
	const e = require('./test-environment');

	test.before(async () => {
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
			e.browser.client = webdriverio.remote({
				desiredCapabilities: {
					browserName: 'chrome',
					loggingPrefs: {
						browser: 'ALL'
					}
				}
			});
		}

		const originalNewWindow = e.browser.client.newWindow.bind(e.browser.client);
		e.browser.client.newWindow = async (...args) => {
			const returnValue = await originalNewWindow(...args);
			await e.browser.client.getCurrentTabId().then(tabId => {
				tabIdsSet.add(tabId);
			});
			return returnValue;
		};

		// Attach our custom methods to this browser instance.
		addCustomBrowserCommands(e.browser.client);

		await e.browser.client.init();
		await e.browser.client.timeouts('script', 30000);

		if (tabs.includes('dashboard')) {
			await e.browser.client.newWindow(C.DASHBOARD_URL, 'NodeCG dashboard', '');
			e.browser.tabs.dashboard = await e.browser.client.getCurrentTabId();
			await e.browser.client.executeAsync(done => {
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
			await e.browser.client.newWindow(`${C.TEST_PANEL_URL}?standalone=true`, 'NodeCG test bundle standalone panel', '');
			e.browser.tabs.panelStandalone = await e.browser.client.getCurrentTabId();
			await e.browser.client.executeAsync(done => {
				const checkForApi = setInterval(() => {
					if (typeof window.dashboardApi !== 'undefined') {
						clearInterval(checkForApi);
						done();
					}
				}, 50);
			});
		}

		if (tabs.includes('graphic')) {
			await e.browser.client.newWindow(C.GRAPHIC_URL, 'NodeCG test bundle graphic', '');
			e.browser.tabs.graphic = await e.browser.client.getCurrentTabId();
			e.browser.client.executeAsync(done => {
				const checkForApi = setInterval(() => {
					if (typeof window.graphicApi !== 'undefined') {
						clearInterval(checkForApi);
						done();
					}
				}, 50);
			});
		}

		if (tabs.includes('single-instance')) {
			await e.browser.client.newWindow(C.SINGLE_INSTANCE_URL, 'NodeCG test single instance graphic', '');
			e.browser.tabs.singleInstance = await e.browser.client.getCurrentTabId();
			e.browser.client.executeAsync(done => {
				const checkForApi = setInterval(() => {
					if (typeof window.singleInstanceApi !== 'undefined') {
						clearInterval(checkForApi);
						done();
					}
				}, 50);
			});
		}

		if (tabs.includes('login')) {
			await e.browser.client.newWindow(C.LOGIN_URL, 'NodeCG login page', '');
			e.browser.tabs.login = await e.browser.client.getCurrentTabId();
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
			const tabIds = Array.from(tabIdsSet);
			for (let i = 0; i < tabIds.length; i++) {
				const tabId = tabIds[i];

				let coverageObj;

				try {
					await e.browser.client.switchTab(tabId);
					const response = await e.browser.client.execute('return window.__coverage__;');
					coverageObj = response.value;
				} catch (e) {
					continue;
				}

				const newCoverageObj = {};
				for (const key in coverageObj) {
					if (!{}.hasOwnProperty.call(coverageObj, key)) {
						continue;
					}

					const absKey = path.resolve('src', key);
					coverageObj[key].path = absKey;
					newCoverageObj[absKey] = coverageObj[key];
				}

				fs.writeFileSync(`.nyc_output/browser-${tabId}}.json`, JSON.stringify(newCoverageObj), 'utf8');
			}
			/* eslint-enable no-await-in-loop */

			return e.browser.client.end();
		}
	});
};
