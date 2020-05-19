// Packages
import anyTest, { TestInterface } from 'ava';
import puppeteer from 'puppeteer';

// Ours
import * as server from '../helpers/server';
import * as browser from '../helpers/browser';

server.setup();
const { initGraphic } = browser.setup();
const test = anyTest as TestInterface<browser.BrowserContext & server.ServerContext>;

let graphic: puppeteer.Page;
test.before(async () => {
	graphic = await initGraphic();
});

// The graphic and dashboard APIs use the same file
// If dashboard API passes all its tests, we just need to make sure that the socket works
test.serial('should receive messages', async t => {
	await graphic.evaluate(() => {
		(window as any).serverToGraphicReceived = false;
		window.graphicApi.listenFor('serverToGraphic', () => {
			(window as any).serverToGraphicReceived = true;
		});
	});

	const sendMessageInterval = setInterval(() => {
		t.context.apis.extension.sendMessage('serverToGraphic');
	}, 500);

	await graphic.evaluate(
		async () =>
			new Promise(resolve => {
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

test.serial.cb('should send messages', t => {
	t.context.apis.extension.listenFor('graphicToServer', t.end);
	graphic.evaluate(() => {
		window.graphicApi.sendMessage('graphicToServer');
	});
});

test.serial('#bundleVersion', async t => {
	const res = await graphic.evaluate(() => {
		return window.graphicApi.bundleVersion;
	});
	t.is(res, '0.0.1');
});

test.serial('#bundleGit', async t => {
	const res = await graphic.evaluate(() => {
		return window.graphicApi.bundleGit;
	});
	t.deepEqual(res, {
		branch: 'master',
		date: '2018-07-13T17:09:29.000Z',
		hash: '6262681c7f35eccd7293d57a50bdd25e4cd90684',
		message: 'Initial commit',
		shortHash: '6262681',
	});
});
