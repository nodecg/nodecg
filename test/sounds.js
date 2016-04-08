/* eslint-env node, mocha, browser */
/* global createjs */
'use strict';

const fs = require('fs.extra');
const assert = require('chai').assert;
const e = require('./setup/test-environment');
const C = require('./setup/test-constants');

describe('sounds - mixer page', function () {
	this.timeout(10000);

	describe('assignable cues', () => {
		it('should list new sound Assets as they are uploaded', done => {
			/*
			 1. Switch to Dashboard tab
			 2. Open Mixer by using hashbang URL
			 3. Add a sound file directly to nodecg/assets/test-bundle/sounds
			 4. Check the list of options in the dropdown select for all assignable cues
			 */
			e.browser.client
				.switchTab(e.browser.tabs.dashboard)
				.url(C.MIXER_URL)
				.then(() => new Promise((resolve, reject) => {
					fs.copy('test/fixtures/assets/test-bundle/sounds/success.ogg',
						'assets/test-bundle/sounds/success.ogg', {replace: true}, err => {
							if (err) {
								reject(err);
								return;
							}

							resolve();
						});
				}))
				.selectorExecuteAsync('#cues > ncg-sound-cue:nth-child(1) > #select', (elements, done) => {
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
