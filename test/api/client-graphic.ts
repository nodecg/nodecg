import type { TestFn } from "ava";
import anyTest from "ava";
import type * as puppeteer from "puppeteer";

import * as browser from "../helpers/browser";
import * as server from "../helpers/server";

server.setup();
const { initGraphic } = browser.setup();
const test = anyTest as TestFn<browser.BrowserContext & server.ServerContext>;

let graphic: puppeteer.Page;
test.before(async () => {
	graphic = await initGraphic();
});

// The graphic and dashboard APIs use the same file
// If dashboard API passes all its tests, we just need to make sure that the socket works
test.serial("should receive messages", async (t) => {
	await graphic.evaluate(() => {
		(window as any).serverToGraphicReceived = false;
		window.graphicApi.listenFor("serverToGraphic", () => {
			(window as any).serverToGraphicReceived = true;
		});
	});

	const sendMessageInterval = setInterval(() => {
		t.context.apis.extension.sendMessage("serverToGraphic");
	}, 500);

	await graphic.evaluate(
		async () =>
			new Promise<void>((resolve) => {
				const checkMessageReceived = setInterval(() => {
					if ((window as any).serverToGraphicReceived) {
						clearInterval(checkMessageReceived);
						resolve();
					}
				}, 50);
			}),
	);

	clearInterval(sendMessageInterval);
	t.pass();
});

test.serial("should send messages", async (t) => {
	t.plan(1);
	const promise = new Promise<void>((resolve) => {
		t.context.apis.extension.listenFor("graphicToServer", () => {
			t.pass();
			resolve();
		});
	});
	void graphic.evaluate(() => {
		void window.graphicApi.sendMessage("graphicToServer");
	});
	return promise;
});

test.serial("#bundleVersion", async (t) => {
	const res = await graphic.evaluate(() => window.graphicApi.bundleVersion);
	t.is(res, "0.0.1");
});

test.serial("#bundleGit", async (t) => {
	const res = await graphic.evaluate(() => window.graphicApi.bundleGit);
	t.deepEqual(res, {
		branch: "master",
		date: "2018-07-13T17:09:29.000Z",
		hash: "6262681c7f35eccd7293d57a50bdd25e4cd90684",
		message: "Initial commit",
		shortHash: "6262681",
	});
});
