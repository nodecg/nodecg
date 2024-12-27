import type { TestFn } from "ava";
import anyTest from "ava";
import * as puppeteer from "puppeteer";
import { argv } from "yargs";
import isCi from "is-ci";

// Ours
import * as C from "./test-constants";
import { sleep } from "./utilities";

export type BrowserContext = {
	browser: puppeteer.Browser;
};
const test = anyTest as TestFn<BrowserContext>;

export const setup = () => {
	let browser: puppeteer.Browser;
	test.serial.before(async () => {
		// The --no-sandbox flag is required to run Headless Chrome on CI
		const args = isCi ? ["--no-sandbox"] : undefined;
		browser = await puppeteer.launch({
			headless: argv["debugTests"] ? false : true,
			args,
		});
	});

	test.after.always(async () => {
		if (!browser) {
			return;
		}

		if (argv["debugTests"]) {
			await sleep(99999999);
		} else {
			await browser.close();
		}
	});
	test.beforeEach((t) => {
		t.context.browser = browser;
	});

	const initDashboard = async (): Promise<puppeteer.Page> => {
		const page = await browser.newPage();
		await page.goto(C.dashboardUrl());
		await page.waitForFunction(
			() => typeof window.dashboardApi !== "undefined",
		);
		await page.waitForFunction(() => window.WebComponentsReady);
		return page;
	};

	const initStandalone = async (): Promise<puppeteer.Page> => {
		const page = await browser.newPage();
		await page.goto(`${C.testPanelUrl()}?standalone=true`);
		await page.waitForFunction(
			() => typeof window.dashboardApi !== "undefined",
		);
		return page;
	};

	const initGraphic = async (): Promise<puppeteer.Page> => {
		const page = await browser.newPage();
		await page.goto(C.graphicUrl());
		await page.waitForFunction(() => typeof window.graphicApi !== "undefined");
		return page;
	};

	const initSingleInstance = async (): Promise<puppeteer.Page> => {
		const page = await browser.newPage();
		await page.goto(C.singleInstanceUrl());
		await page.waitForFunction(() => {
			if (window.location.pathname.endsWith("busy.html")) {
				return true;
			}

			if (window.location.pathname.endsWith("killed.html")) {
				return true;
			}

			return typeof window.singleInstanceApi !== "undefined";
		});
		await sleep(500);
		return page;
	};

	const initLogin = async (): Promise<puppeteer.Page> => {
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
