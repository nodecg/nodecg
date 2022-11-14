// Packages
import test from 'ava';

// Ours
import parseSounds from '../../src/server/bundle-parser/sounds';

test('should return the parsed soundCues', (t) => {
	const input = [
		{
			name: 'name-only',
		},
		{
			name: 'default-volume',
			defaultVolume: 80,
		},
		{
			name: 'non-assignable',
			assignable: false,
		},
		{
			name: 'default-file',
			defaultFile: '../fixtures/bundle-parser/default-file.ogg',
		},
	];

	const output = [
		{
			name: 'name-only',
			assignable: true,
		},
		{
			name: 'default-volume',
			defaultVolume: 80,
			assignable: true,
		},
		{
			name: 'non-assignable',
			assignable: false,
		},
		{
			name: 'default-file',
			defaultFile: '../fixtures/bundle-parser/default-file.ogg',
			assignable: true,
		},
	];

	const manifest = {
		name: 'test-bundle',
		soundCues: input,
	};

	const result = parseSounds(__dirname, manifest);

	t.deepEqual(result.soundCues, output);
});

test('should set bundle.soundCues to an empty array when pkg.nodecg.soundCues does not exist', (t) => {
	const result = parseSounds(__dirname, {
		name: 'test-bundle',
	});
	t.deepEqual(result.soundCues, []);
});

test('should throw an error when pkg.nodecg.soundCues is not an Array', (t) => {
	const error = t.throws(() => {
		return parseSounds(__dirname, {
			name: 'test-bundle',
			// @ts-expect-error
			soundCues: 'foo',
		});
	});

	t.is(error.message, "test-bundle's nodecg.soundCues is not an Array");
});

test('should throw an error when a soundCue lacks a name', (t) => {
	const error = t.throws(() => {
		return parseSounds(__dirname, {
			name: 'test-bundle',
			// @ts-expect-error
			soundCues: [{}],
		});
	});

	t.is(error.message, 'nodecg.soundCues[0] in bundle test-bundle lacks a "name" property');
});

test('should clamp default volume to a max of 100', (t) => {
	const result = parseSounds(__dirname, {
		name: 'test-bundle',
		soundCues: [
			{
				name: 'cue',
				defaultVolume: 101,
			},
		],
	});
	t.is(result.soundCues[0].defaultVolume, 100);
});

test('should clamp default volume to a min of 0', (t) => {
	const result = parseSounds(__dirname, {
		name: 'test-bundle',
		soundCues: [
			{
				name: 'cue',
				defaultVolume: -1,
			},
		],
	});
	t.is(result.soundCues[0].defaultVolume, 0);
});

test("should throw an error when a soundCue's default file doesn't exist", (t) => {
	const error = t.throws(() => {
		return parseSounds(__dirname, {
			name: 'test-bundle',
			soundCues: [
				{
					name: 'cue',
					defaultFile: 'nope',
				},
			],
		});
	});

	t.is(error.message, 'nodecg.soundCues[0].defaultFile in bundle test-bundle does not exist');
});
