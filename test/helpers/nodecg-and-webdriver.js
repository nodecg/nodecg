process.env.test = true;
process.env.NODECG_TEST = true;

// Native
const fs = require('fs');
const path = require('path');

// Packages
const fse = require('fs-extra');
const temp = require('temp');
const puppeteer = require('puppeteer');

const tabIdsSet = new Set();
const tempFolder = temp.mkdirSync();
temp.track(); // Automatically track and cleanup files at exit.

// Tell NodeCG to look in our new temp folder for bundles, cfg, db, and assets, rather than whatever ones the user
// may have. We don't want to touch any existing user data!
process.env.NODECG_ROOT = tempFolder;

let browser;
const IS_TRAVIS = process.env.TRAVIS_OS_NAME && process.env.TRAVIS_JOB_NUMBER;
const launchBrowserPromise = puppeteer.launch({headless: IS_TRAVIS}).then(b => {
	browser = b;
});

module.exports = function (test, {tabs, nodecgConfigName = 'nodecg.json'} = {}) {
	fse.copySync('test/fixtures/nodecg-core/assets', path.join(tempFolder, 'assets'));
	fse.copySync('test/fixtures/nodecg-core/bundles', path.join(tempFolder, 'bundles'));
	fse.moveSync(path.join(tempFolder, 'bundles/test-bundle/git'), path.join(tempFolder, 'bundles/test-bundle/.git'));
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

		await launchBrowserPromise;
		e.browser.client = browser;

		if (tabs.includes('dashboard')) {
			const page = await browser.newPage();
			await page.goto(C.DASHBOARD_URL);
			e.browser.tabs.dashboard = page;
			await page.evaluate(() => new Promise(resolve => {
				const checkForApi = setInterval(() => {
					if (
						typeof window.dashboardApi !== 'undefined' &&
						typeof window.Polymer !== 'undefined'
					) {
						clearInterval(checkForApi);
						window.Polymer.RenderStatus.afterNextRender(this, resolve);
					}
				}, 50);
			}));
		}

		if (tabs.includes('standalone')) {
			const page = await browser.newPage();
			await page.goto(`${C.TEST_PANEL_URL}?standalone=true`);
			e.browser.tabs.panelStandalone = page;
			await page.evaluate(() => new Promise(resolve => {
				const checkForApi = setInterval(() => {
					if (typeof window.dashboardApi !== 'undefined') {
						clearInterval(checkForApi);
						resolve();
					}
				}, 50);
			}));
		}

		if (tabs.includes('graphic')) {
			const page = await browser.newPage();
			await page.goto(C.GRAPHIC_URL);
			e.browser.tabs.graphic = page;
			page.evaluate(() => new Promise(resolve => {
				const checkForApi = setInterval(() => {
					if (typeof window.graphicApi !== 'undefined') {
						clearInterval(checkForApi);
						resolve();
					}
				}, 50);
			}));
		}

		if (tabs.includes('single-instance')) {
			const page = await browser.newPage();
			await page.goto(C.SINGLE_INSTANCE_URL);
			e.browser.tabs.singleInstance = page;
			page.evaluate(() => new Promise(resolve => {
				const checkForApi = setInterval(() => {
					if (typeof window.singleInstanceApi !== 'undefined') {
						clearInterval(checkForApi);
						resolve();
					}
				}, 50);
			}));
		}

		if (tabs.includes('login')) {
			e.browser.tabs.login = await e.browser.client.newPage();
			await e.browser.tabs.login.goto(C.LOGIN_URL);
		}
	});

	test.after.always(async () => {
		if (e.server) {
			e.server.stop();
		}

		if (browser) {
			if (!fs.existsSync('.nyc_output')) {
				fs.mkdirSync('.nyc_output');
			}

			/* eslint-disable no-await-in-loop */
			for (const tabId of tabIdsSet) {
				let coverageObj;

				try {
					await e.browser.client.switchTab(tabId);
					const response = await e.browser.client.execute('return window.__coverage__;');
					coverageObj = response.value;
				} catch (e) {
					continue;
				}

				if (
					!coverageObj ||
					typeof coverageObj !== 'object' ||
					Object.keys(coverageObj).length <= 0
				) {
					continue;
				}

				const newCoverageObj = {};
				for (const key of Object.keys(coverageObj)) {
					const absKey = path.resolve('src', key);
					coverageObj[key].path = absKey;
					newCoverageObj[absKey] = coverageObj[key];
				}
				fs.writeFileSync(
					`.nyc_output/browser-${tabId}}.json`,
					JSON.stringify(newCoverageObj),
					'utf8'
				);
			}
			/* eslint-enable no-await-in-loop */

			return browser.close();
		}
	});
};
