/* eslint-env node, mocha, browser */
/* global createjs */
'use strict';

const e = require('./setup/test-environment');
const assert = require('chai').assert;

describe('sounds', function () {
	this.timeout(10000);

	before(done => {
		e.browser.client
			.switchTab(e.browser.tabs.graphic)
			.then(() => done());
	});

	describe('client api', () => {
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
});
