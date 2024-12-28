import { expect } from "vitest";

import { setupTest } from "../helpers/setup";

const test = await setupTest();

// The graphic and dashboard APIs use the same file
// If dashboard API passes all its tests, we just need to make sure that the socket works
test("should receive messages", async ({ graphic, apis }) => {
	await graphic.evaluate(() => {
		(window as any).serverToGraphicReceived = false;
		window.graphicApi.listenFor("serverToGraphic", () => {
			(window as any).serverToGraphicReceived = true;
		});
	});

	const sendMessageInterval = setInterval(() => {
		apis.extension.sendMessage("serverToGraphic");
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
});

test("should send messages", async ({ apis, graphic }) => {
	const promise = new Promise<void>((resolve) => {
		apis.extension.listenFor("graphicToServer", () => {
			resolve();
		});
	});
	await graphic.evaluate(() => {
		void window.graphicApi.sendMessage("graphicToServer");
	});
	await promise;
});

test("#bundleVersion", async ({ graphic }) => {
	const res = await graphic.evaluate(() => window.graphicApi.bundleVersion);
	expect(res).toBe("0.0.1");
});

test("#bundleGit", async ({ graphic }) => {
	const res = await graphic.evaluate(() => window.graphicApi.bundleGit);
	expect(res).toMatchInlineSnapshot(`
		{
		  "branch": "master",
		  "date": "2018-07-13T17:09:29.000Z",
		  "hash": "6262681c7f35eccd7293d57a50bdd25e4cd90684",
		  "message": "Initial commit",
		  "shortHash": "6262681",
		}
	`);
});
