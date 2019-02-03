/* eslint-disable ava/no-ignored-test-files */

// Native
import * as fs from 'fs';
import * as path from 'path';
import {v4 as uuid} from 'uuid';

// Packages
import test from 'ava';
import puppeteer from 'puppeteer';

// Ours
import * as C from './test-constants';

const IS_TRAVIS = process.env.TRAVIS_OS_NAME && process.env.TRAVIS_JOB_NUMBER;

export const setup = () => {
	let browser;
	test.before(async () => {
		// Use Chromium's headless mode if in CI environment
		const headless = Boolean(IS_TRAVIS);
		// The --no-sandbox flag is required to run Headless Chrome on Travis
		const args = IS_TRAVIS ? ['--no-sandbox'] : undefined;
		browser = await puppeteer.launch({headless, args});
	});

	test.beforeEach(t => {
		t.context.browser = browser;
	});

	test.after.always(async () => {
		if (!browser) {
			return;
		}

		if (!fs.existsSync('.nyc_output')) {
			fs.mkdirSync('.nyc_output');
		}

		/* eslint-disable no-await-in-loop */
		for (const page of await browser.pages()) {
			let coverageObj;
			try {
				coverageObj = await page.evaluate(() => window.__coverage__);
			} catch (err) {
				continue;
			}

			if (
				!coverageObj ||
				typeof coverageObj !== 'object' ||
				Object.keys(coverageObj).length === 0
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
				`.nyc_output/browser-${uuid()}.json`,
				JSON.stringify(newCoverageObj),
				'utf8'
			);
		}
		/* eslint-enable no-await-in-loop */

		await browser.close();
	});

	const initDashboard = async () => {
		const page = await browser.newPage();
		await page.goto(C.dashboardUrl());
		await page.waitForFunction(() =>
			typeof window.dashboardApi !== 'undefined' && typeof window.Polymer !== 'undefined');
		await page.evaluate(() => new Promise(resolve => {
			window.Polymer.RenderStatus.afterNextRender(this, resolve);
		}));
		return page;
	};

	const initStandalone = async () => {
		const page = await browser.newPage();
		await page.goto(`${C.testPanelUrl()}?standalone=true`);
		await page.waitForFunction(() => typeof window.dashboardApi !== 'undefined');
		return page;
	};

	const initGraphic = async () => {
		const page = await browser.newPage();
		await page.goto(C.graphicUrl());
		await page.waitForFunction(() => typeof window.graphicApi !== 'undefined');
		return page;
	};

	const initSingleInstance = async () => {
		const page = await browser.newPage();
		await page.goto(C.singleInstanceUrl());
		return page;
	};

	const initLogin = async () => {
		const page = await browser.newPage();
		await page.goto(C.loginUrl());
		return page;
	};

	return {
		initDashboard,
		initStandalone,
		initGraphic,
		initSingleInstance,
		initLogin
	};
};
