/* eslint-env node, mocha, browser */
'use strict';

process.env.test = true;
process.env.NODECG_TEST = true;
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');
const temp = require('temp');
const tempFolder = temp.mkdirSync();

// Automatically track and cleanup files at exit.
temp.track();

fse.copySync('test/fixtures/assets', path.join(tempFolder, 'assets'));
fse.copySync('test/fixtures/bundles', path.join(tempFolder, 'bundles'));
fse.copySync('test/fixtures/cfg', path.join(tempFolder, 'cfg'));
fse.copySync('test/fixtures/db', path.join(tempFolder, 'db'));

// Tell NodeCG to look in our new temp folder for bundles, cfg, db, and assets, rather than whatever ones the user
// may have. We don't want to touch any existing user data!
process.env.NODECG_ROOT = tempFolder;

const webdriverio = require('webdriverio');
const e = require('./setup/test-environment');
const C = require('./setup/test-constants');
const addCustomBrowserCommands = require('./setup/custom-webdriver-commands');

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
		// Extension API setup
		e.apis.extension = e.server.getExtensions()[C.BUNDLE_NAME];

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
			.timeouts('script', 5000)
			.call(done)
			.catch(done);
	});

	e.server.start();
});

after(async function () {
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

		console.log('writing coverage for:', tabName);
		fs.writeFileSync(`.nyc_output/browser-${tabName}.json`, JSON.stringify(newCoverageObj), 'utf-8');
	}
	/* eslint-enable no-await-in-loop */

	e.server.stop();
	this.timeout(10000);
	return e.browser.client.end();
});
