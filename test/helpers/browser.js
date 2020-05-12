/* eslint-disable ava/no-ignored-test-files */

// Native
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';

// Packages
import test from 'ava';
import puppeteer from 'puppeteer';
import isCi from 'is-ci';

// Ours
import * as C from './test-constants';
import { sleep } from './utilities';

export const setup = () => {
	let browser;
	test.serial.before(async () => {
		// The --no-sandbox flag is required to run Headless Chrome on Travis
		const args = isCi ? ['--no-sandbox'] : undefined;
		browser = await puppeteer.launch({
			headless: true,
			args,
		});
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
			} catch (_) {
				continue;
			}

			if (!coverageObj || typeof coverageObj !== 'object' || Object.keys(coverageObj).length === 0) {
				continue;
			}

			const newCoverageObj = {};
			for (const key of Object.keys(coverageObj)) {
				const absKey = path.resolve('src', key);
				coverageObj[key].path = absKey;
				newCoverageObj[absKey] = coverageObj[key];
			}

			fs.writeFileSync(`.nyc_output/browser-${uuid()}.json`, JSON.stringify(newCoverageObj), 'utf8');
		}
		/* eslint-enable no-await-in-loop */

		await browser.close();
	});
	test.beforeEach(t => {
		t.context.browser = browser;
	});

	const initDashboard = async () => {
		const page = await browser.newPage();
		await page.goto(C.dashboardUrl());
		await page.waitForFunction(() => typeof window.dashboardApi !== 'undefined');
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
		await page.waitForFunction(() => {
			if (window.location.pathname.endsWith('busy.html')) {
				return true;
			}

			if (window.location.pathname.endsWith('killed.html')) {
				return true;
			}

			return typeof window.singleInstanceApi !== 'undefined';
		});
		await sleep(500);
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
		initLogin,
	};
};
