// Native
import path from 'path';

// Packages
import fs from 'fs-extra';
import type { TestInterface } from 'ava';
import anyTest from 'ava';

// Ours
import * as server from './helpers/server';
import * as browser from './helpers/browser';

const test = anyTest as TestInterface<browser.BrowserContext & server.ServerContext>;
server.setup();
const { initDashboard, initGraphic } = browser.setup();

import * as C from './helpers/test-constants';
import type { Page } from 'puppeteer';

let dashboard: Page;
let graphic: Page;
test.before(async () => {
	dashboard = await initDashboard();
	graphic = await initGraphic();
});

test.serial('soundCues replicant - should generate the correct defaultValue', (t) => {
	const rep = t.context.apis.extension.Replicant('soundCues', 'test-bundle');
	t.deepEqual(rep.value, [
		{
			name: 'name-only',
			assignable: true,
			volume: 30,
		},
		{
			name: 'default-volume',
			defaultVolume: 80,
			assignable: true,
			volume: 80,
		},
		{
			name: 'non-assignable',
			assignable: false,
			volume: 30,
		},
		{
			name: 'default-file',
			defaultFile: {
				sum: '9f7f2776691fdcb242c1fc72e115f5c24c63273c',
				base: 'default-file.ogg',
				ext: '.ogg',
				name: 'default-file',
				url: '/sound/test-bundle/default-file/default.ogg',
				default: true,
			},
			assignable: true,
			file: {
				sum: '9f7f2776691fdcb242c1fc72e115f5c24c63273c',
				base: 'default-file.ogg',
				ext: '.ogg',
				name: 'default-file',
				url: '/sound/test-bundle/default-file/default.ogg',
				default: true,
			},
			volume: 30,
		},
	]);
});

test.serial('soundCues replicant - should remove any persisted cues that are no longer in the bundle manifest', (t) => {
	const rep = t.context.apis.extension.Replicant('soundCues', 'remove-persisted-cues');
	t.deepEqual(rep.value, [
		{
			name: 'persisted-cue-1',
			assignable: true,
			volume: 30,
		},
	]);
});

test.serial(
	"soundCues replicant - should add any cues in the bundle manifest that aren't in the persisted replicant.",
	(t) => {
		const rep = t.context.apis.extension.Replicant('soundCues', 'add-manifest-cues');
		t.deepEqual(rep.value, [
			{
				name: 'persisted-cue-1',
				assignable: true,
				volume: 30,
			},
			{
				name: 'manifest-cue-1',
				assignable: true,
				volume: 30,
			},
		]);
	},
);

test.serial(
	'soundCues replicant - should update any cues in that are in both in the persisted replicant and the bundle manifest.',
	(t) => {
		const rep = t.context.apis.extension.Replicant('soundCues', 'update-cues');
		t.deepEqual(rep.value, [
			{
				name: 'updated-cue',
				defaultFile: {
					base: 'default-file.ogg',
					default: true,
					ext: '.ogg',
					name: 'default-file',
					sum: '9f7f2776691fdcb242c1fc72e115f5c24c63273c',
					url: '/sound/update-cues/updated-cue/default.ogg',
				},
				assignable: false,
				file: {
					sum: '9f7f2776691fdcb242c1fc72e115f5c24c63273c',
					base: 'default-file.ogg',
					ext: '.ogg',
					name: 'default-file',
					url: '/sound/update-cues/updated-cue/default.ogg',
					default: true,
				},
				volume: 30,
			},
		]);
	},
);

test.serial('mixer - assignable cues - should list new sound Assets as they are uploaded', async (t) => {
	/*
	 1. Switch to Dashboard tab
	 2. Add a sound file directly to nodecg/assets/test-bundle/sounds
	 3. Check the list of options in the dropdown select for all assignable cues
	 */
	await new Promise<void>((resolve, reject) => {
		const oggPath = path.join(C.assetsRoot(), 'test-bundle/sounds/success.ogg');
		fs.copy('test/fixtures/nodecg-core/assets/test-bundle/sounds/success.ogg', oggPath, (err) => {
			if (err) {
				reject(err);
				return;
			}

			resolve();
		});
	});

	const ret = await dashboard.evaluate(
		async () =>
			new Promise<string | void>((resolve) => {
				const el = (document as any)
					.querySelector('ncg-dashboard')
					.shadowRoot.querySelector('ncg-mixer')
					.shadowRoot.querySelector('ncg-sounds[bundle-name="test-bundle"]')
					.shadowRoot.querySelector('ncg-sound-cue:nth-child(1)').$.select.$.select;

				if (!el) {
					resolve('NoSuchElement');
					return;
				}

				const interval = setInterval(() => {
					const { options } = el;
					if (options.length === 2 && options[1].value === 'success.ogg') {
						clearInterval(interval);
						resolve();
					}
				}, 50);
			}),
	);

	t.true(ret !== 'NoSuchElement');
});

test.serial('client api - should emit "ncgSoundsReady" once all the sounds have loaded', async (t) => {
	await graphic.evaluate(
		async () =>
			new Promise<void>((resolve) => {
				if (window.graphicApi.soundsReady) {
					resolve();
				} else {
					window.addEventListener('ncgSoundsReady', () => {
						resolve();
					});
				}
			}),
	);

	t.pass();
});

test.serial('client api - #playSound should return a playing AbstractAudioInstance', async (t) => {
	const ret = await graphic.evaluate(() => window.graphicApi.playSound('default-file')!.playState);

	t.is(ret, 'playSucceeded');
});

test.serial('client api - #stopSound should stop all instances of a cue', async (t) => {
	const ret = await graphic.evaluate(() => {
		window.graphicApi.playSound('default-file');
		window.graphicApi.playSound('default-file');
		window.graphicApi.stopSound('default-file');
		return (window as any).createjs.Sound._instances.length;
	});

	t.is(ret, 0);
});

test.serial('client api - #stopAllSounds should stop all instances', async (t) => {
	const ret = await graphic.evaluate(() => {
		window.graphicApi.playSound('default-file');
		window.graphicApi.playSound('default-file');
		window.graphicApi.stopAllSounds();
		return (window as any).createjs.Sound._instances.length;
	});

	t.is(ret, 0);
});
