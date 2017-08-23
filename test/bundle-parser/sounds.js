'use strict';

// Packages
const test = require('ava');

// Ours
const parseSounds = require('../../lib/bundle-parser/sounds');

test('should return the parsed soundCues', t => {
	const input = [{
		name: 'name-only'
	}, {
		name: 'default-volume',
		defaultVolume: 80
	}, {
		name: 'non-assignable',
		assignable: false
	}, {
		name: 'default-file',
		defaultFile: '../fixtures/bundle-parser/default-file.ogg'
	}];

	const output = [{
		name: 'name-only',
		assignable: true
	}, {
		name: 'default-volume',
		defaultVolume: 80,
		assignable: true
	}, {
		name: 'non-assignable',
		assignable: false
	}, {
		name: 'default-file',
		defaultFile: '../fixtures/bundle-parser/default-file.ogg',
		assignable: true
	}];

	const bundle = {
		dir: __dirname
	};

	const pkg = {
		name: 'test-bundle',
		nodecg: {soundCues: input}
	};

	parseSounds(bundle, pkg);

	t.deepEqual(bundle.soundCues, output);
});

test('should set bundle.soundCues to an empty array when pkg.nodecg.soundCues does not exist', t => {
	const bundle = {};
	parseSounds(bundle, {
		name: 'test-bundle',
		nodecg: {}
	});
	t.deepEqual(bundle.soundCues, []);
});

test('should throw an error when pkg.nodecg.soundCues is not an Array', t => {
	const error = t.throws(parseSounds.bind(null, {}, {
		name: 'test-bundle',
		nodecg: {
			soundCues: 'foo'
		}
	}));

	t.is(error.message, 'test-bundle\'s nodecg.soundCues is not an Array');
});

test('should throw an error when a soundCue lacks a name', t => {
	const error = t.throws(parseSounds.bind(null, {}, {
		name: 'test-bundle',
		nodecg: {
			soundCues: [{}]
		}
	}));

	t.is(error.message, 'nodecg.soundCues[0] in bundle test-bundle lacks a "name" property');
});

test('should clamp default volume to a max of 100', t => {
	const bundle = {};
	parseSounds(bundle, {
		name: 'test-bundle',
		nodecg: {
			soundCues: [{
				name: 'cue',
				defaultVolume: 101
			}]
		}
	});
	t.is(bundle.soundCues[0].defaultVolume, 100);
});

test('should clamp default volume to a min of 0', t => {
	const bundle = {};
	parseSounds(bundle, {
		name: 'test-bundle',
		nodecg: {
			soundCues: [{
				name: 'cue',
				defaultVolume: -1
			}]
		}
	});
	t.is(bundle.soundCues[0].defaultVolume, 0);
});

test('should throw an error when a soundCue\'s default file doesn\'t exist', t => {
	const error = t.throws(parseSounds.bind(null, {
		dir: __dirname
	}, {
		name: 'test-bundle',
		nodecg: {
			soundCues: [{
				name: 'cue',
				defaultFile: 'nope'
			}]
		}
	}));

	t.is(error.message, 'nodecg.soundCues[0].defaultFile in bundle test-bundle does not exist');
});
