'use strict';

// Packages
const fs = require('fs-extra');
const path = require('path');
const test = require('ava');

// Ours
require('./helpers/nodecg-and-webdriver')(test, ['dashboard', 'graphic']); // Must be first.
const e = require('./helpers/test-environment');
const C = require('./helpers/test-constants');

test.serial('soundCues replicant - should generate the correct defaultValue', t => {
	const rep = e.apis.extension.Replicant('soundCues', 'test-bundle');
	t.deepEqual(rep.value, [{
		name: 'name-only',
		assignable: true,
		file: null,
		volume: 30
	}, {
		name: 'default-volume',
		defaultVolume: 80,
		assignable: true,
		file: null,
		volume: 80
	}, {
		name: 'non-assignable',
		assignable: false,
		file: null,
		volume: 30
	}, {
		name: 'default-file',
		defaultFile: {
			sum: '9f7f2776691fdcb242c1fc72e115f5c24c63273c',
			base: 'default-file.ogg',
			ext: '.ogg',
			name: 'default-file',
			url: '/sound/test-bundle/default-file/default.ogg',
			default: true
		},
		assignable: true,
		file: {
			sum: '9f7f2776691fdcb242c1fc72e115f5c24c63273c',
			base: 'default-file.ogg',
			ext: '.ogg',
			name: 'default-file',
			url: '/sound/test-bundle/default-file/default.ogg',
			default: true
		},
		volume: 30
	}]);
});

test.serial('soundCues replicant - should remove any persisted cues that are no longer in the bundle manifest', t => {
	const rep = e.apis.extension.Replicant('soundCues', 'remove-persisted-cues');
	t.deepEqual(rep.value, [{
		name: 'persisted-cue-1',
		assignable: true,
		file: null,
		volume: 30
	}]);
});

test.serial('soundCues replicant - should add any cues in the bundle manifest that aren\'t in the persisted replicant.', t => {
	const rep = e.apis.extension.Replicant('soundCues', 'add-manifest-cues');
	t.deepEqual(rep.value, [{
		name: 'persisted-cue-1',
		assignable: true,
		file: null,
		volume: 30
	}, {
		name: 'manifest-cue-1',
		assignable: true,
		file: null,
		volume: 30
	}]);
});

test.serial('soundCues replicant - should update any cues in that are in both in the persisted replicant and the bundle manifest.', t => {
	const rep = e.apis.extension.Replicant('soundCues', 'update-cues');
	t.deepEqual(rep.value, [{
		name: 'updated-cue',
		defaultFile: {
			base: 'default-file.ogg',
			default: true,
			ext: '.ogg',
			name: 'default-file',
			sum: '9f7f2776691fdcb242c1fc72e115f5c24c63273c',
			url: '/sound/update-cues/updated-cue/default.ogg'
		},
		assignable: false,
		file: {
			sum: '9f7f2776691fdcb242c1fc72e115f5c24c63273c',
			base: 'default-file.ogg',
			ext: '.ogg',
			name: 'default-file',
			url: '/sound/update-cues/updated-cue/default.ogg',
			default: true
		},
		volume: 30
	}]);
});

test.serial('mixer - assignable cues - should list new sound Assets as they are uploaded', async t => {
	/*
	 1. Switch to Dashboard tab
	 2. Add a sound file directly to nodecg/assets/test-bundle/sounds
	 3. Check the list of options in the dropdown select for all assignable cues
	 */
	await e.browser.client.switchTab(e.browser.tabs.dashboard);
	await e.browser.client.then(() => new Promise((resolve, reject) => {
		const oggPath = path.join(C.ASSETS_ROOT, 'test-bundle/sounds/success.ogg');
		fs.copy('test/fixtures/assets/test-bundle/sounds/success.ogg', oggPath, {replace: true}, err => {
			if (err) {
				reject(err);
				return;
			}

			resolve();
		});
	}));

	const ret = await e.browser.client.executeAsync(done => {
		const el = document.querySelector('ncg-dashboard').shadowRoot
			.querySelector('ncg-mixer').shadowRoot
			.querySelector('ncg-sounds[bundle-name="test-bundle"]').shadowRoot
			.querySelector('ncg-sound-cue:nth-child(1)').shadowRoot
			.querySelector('#select');

		if (!el) {
			return done('NoSuchElement');
		}

		const interval = setInterval(() => {
			const options = el.options;
			if (options.length === 2 && options[1].value === 'success.ogg') {
				clearInterval(interval);
				done();
			}
		}, 50);
	});

	t.true(ret.value !== 'NoSuchElement');
});

test.serial('client api - should emit "ncgSoundsReady" once all the sounds have loaded', async t => {
	await e.browser.client.switchTab(e.browser.tabs.graphic);
	await e.browser.client.executeAsync(done => {
		if (window.graphicApi.soundsReady) {
			done();
		} else {
			window.addEventListener('ncgSoundsReady', () => done());
		}
	});

	t.pass();
});

test.serial('client api - #playSound should return a playing AbstractAudioInstance', async t => {
	await e.browser.client.switchTab(e.browser.tabs.graphic);
	const ret = await e.browser.client.execute(() => {
		return window.graphicApi.playSound('default-file').playState;
	});

	t.is(ret.value, 'playSucceeded');
});

test.serial('client api - #stopSound should stop all instances of a cue', async t => {
	await e.browser.client.switchTab(e.browser.tabs.graphic);
	const ret = await e.browser.client.execute(() => {
		window.graphicApi.playSound('default-file');
		window.graphicApi.playSound('default-file');
		window.graphicApi.stopSound('default-file');
		return createjs.Sound._instances.length; // eslint-disable-line no-undef
	});

	t.is(ret.value, 0);
});

test.serial('client api - #stopAllSounds should stop all instances', async t => {
	await e.browser.client.switchTab(e.browser.tabs.graphic);
	const ret = await e.browser.client.execute(() => {
		window.graphicApi.playSound('default-file');
		window.graphicApi.playSound('default-file');
		window.graphicApi.stopAllSounds();
		return createjs.Sound._instances.length; // eslint-disable-line no-undef
	});

	t.is(ret.value, 0);
});
