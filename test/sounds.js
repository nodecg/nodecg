/* eslint-env node, mocha, browser */
/* global createjs */
'use strict';

const path = require('path');
const fs = require('fs-extra');
const assert = require('chai').assert;
const e = require('./setup/test-environment');
const C = require('./setup/test-constants');

describe('sounds - soundCues replicant', () => {
	it('should generate the correct defaultValue', () => {
		const rep = e.apis.extension.Replicant('soundCues', 'test-bundle');
		assert.deepEqual(rep.value, [{
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

	it('should remove any persisted cues that are no longer in the bundle manifest', () => {
		const rep = e.apis.extension.Replicant('soundCues', 'remove-persisted-cues');
		assert.deepEqual(rep.value, [{
			name: 'persisted-cue-1',
			assignable: true,
			file: null,
			volume: 30
		}]);
	});

	it('should add any cues in the bundle manifest that aren\'t in the persisted replicant.', () => {
		const rep = e.apis.extension.Replicant('soundCues', 'add-manifest-cues');
		assert.deepEqual(rep.value, [{
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

	it('should update any cues in that are in both in the persisted replicant and the bundle manifest.', () => {
		const rep = e.apis.extension.Replicant('soundCues', 'update-cues');
		assert.deepEqual(rep.value, [{
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
});

describe('sounds - mixer page', function () {
	this.timeout(10000);

	describe('assignable cues', () => {
		it('should list new sound Assets as they are uploaded', done => {
			/*
			 1. Switch to Dashboard tab
			 2. Add a sound file directly to nodecg/assets/test-bundle/sounds
			 3. Check the list of options in the dropdown select for all assignable cues
			 */
			e.browser.client
				.switchTab(e.browser.tabs.dashboard)
				.then(() => new Promise((resolve, reject) => {
					fs.copy('test/fixtures/assets/test-bundle/sounds/success.ogg',
						path.join(C.ASSETS_ROOT, 'test-bundle/sounds/success.ogg'), {replace: true}, err => {
							if (err) {
								reject(err);
								return;
							}

							resolve();
						});
				}))
				.selectorExecuteAsync('ncg-sounds[bundle-name="test-bundle"] ncg-sound-cue:nth-child(1) > #select', (elements, done) => {
					const interval = setInterval(() => {
						const options = elements[0].options;
						if (options.length === 2 && options[1].value === 'success.ogg') {
							clearInterval(interval);
							done();
						}
					}, 50);
				})
				.then(() => done())
				.catch(err => done(err));
		});
	});
});

describe('sounds - client api', function () {
	this.timeout(10000);

	before(done => {
		e.browser.client
			.switchTab(e.browser.tabs.graphic)
			.then(() => done());
	});

	it('should emit "ncgSoundsReady" once all the sounds have loaded', done => {
		e.browser.client
			.executeAsync(done => {
				if (window.graphicApi.soundsReady) {
					done();
				} else {
					window.addEventListener('ncgSoundsReady', () => done());
				}
			})
			.then(() => done())
			.catch(done);
	});

	it('#playSound should return a playing AbstractAudioInstance', done => {
		e.browser.client
			.execute(() => {
				return window.graphicApi.playSound('default-file').playState;
			})
			.then(ret => {
				assert.equal(ret.value, 'playSucceeded');
				done();
			})
			.catch(done);
	});

	// This test depends on the "should list new sound Assets as they are uploaded" test
	// TODO: Figure out why this test is so flaky, and re-enable it.
	it.skip('#playSound should play the right sound after changing away from and then back to a sound', done => {
		e.browser.client
		// Play success.ogg
			.switchTab(e.browser.tabs.dashboard)
			.execute(() => {
				const ncgSoundCue = document.querySelector('#cues > ncg-sound-cue:nth-child(4)');
				ncgSoundCue.$.select.value = 'success.ogg';
				ncgSoundCue._retargetFile();
			})
			.switchTab(e.browser.tabs.graphic)
			.pause(1000) // Give the Replicant some time to update.
			.execute(() => {
				const instance = window.graphicApi.playSound('default-file');
				return {
					playState: instance.playState,
					src: instance.src.split('?')[0]
				};
			})
			.then(ret => {
				assert.equal(ret.value.playState, 'playSucceeded');
				assert.equal(ret.value.src, '/assets/test-bundle/sounds/success.ogg');
			})

			// Play default sound
			.switchTab(e.browser.tabs.dashboard)
			.execute(() => {
				const ncgSoundCue = document.querySelector('#cues > ncg-sound-cue:nth-child(4)');
				ncgSoundCue.$.select.value = 'default';
				ncgSoundCue._retargetFile();
			})
			.switchTab(e.browser.tabs.graphic)
			.pause(1000) // Give the Replicant some time to update.
			.execute(() => {
				const instance = window.graphicApi.playSound('default-file');
				return {
					playState: instance.playState,
					src: instance.src.split('?')[0]
				};
			})
			.then(ret => {
				assert.equal(ret.value.playState, 'playSucceeded');
				assert.equal(ret.value.src, '/sound/test-bundle/default-file/default.ogg');
				done();
			})
			.catch(done);
	});

	it('#stopSound should stop all instances of a cue', done => {
		e.browser.client
			.execute(() => {
				window.graphicApi.playSound('default-file');
				window.graphicApi.playSound('default-file');
				window.graphicApi.stopSound('default-file');
				return createjs.Sound._instances.length;
			})
			.then(ret => {
				assert.equal(ret.value, 0);
				done();
			})
			.catch(done);
	});

	it('#stopAllSounds should stop all instances', done => {
		e.browser.client
			.execute(() => {
				window.graphicApi.playSound('default-file');
				window.graphicApi.playSound('default-file');
				window.graphicApi.stopAllSounds();
				return createjs.Sound._instances.length;
			})
			.then(ret => {
				assert.equal(ret.value, 0);
				done();
			})
			.catch(done);
	});
});
