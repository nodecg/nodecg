import { expect, test } from "vitest";

import { parseSounds } from "../../src/server/bundle-parser/sounds";

test("should return the parsed soundCues", () => {
	const input = [
		{
			name: "name-only",
		},
		{
			name: "default-volume",
			defaultVolume: 80,
		},
		{
			name: "non-assignable",
			assignable: false,
		},
		{
			name: "default-file",
			defaultFile: "../fixtures/bundle-parser/default-file.ogg",
		},
	];

	const output = [
		{
			name: "name-only",
			assignable: true,
		},
		{
			name: "default-volume",
			defaultVolume: 80,
			assignable: true,
		},
		{
			name: "non-assignable",
			assignable: false,
		},
		{
			name: "default-file",
			defaultFile: "../fixtures/bundle-parser/default-file.ogg",
			assignable: true,
		},
	];

	const manifest = {
		name: "test-bundle",
		soundCues: input,
	};

	const result = parseSounds(__dirname, manifest);

	expect(result.soundCues).toEqual(output);
});

test("should set bundle.soundCues to an empty array when pkg.nodecg.soundCues does not exist", () => {
	const result = parseSounds(__dirname, {
		name: "test-bundle",
	});
	expect(result.soundCues).toEqual([]);
});

test("should throw an error when pkg.nodecg.soundCues is not an Array", () => {
	expect(() =>
		parseSounds(__dirname, {
			name: "test-bundle",
			// @ts-expect-error
			soundCues: "foo",
		}),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: test-bundle's nodecg.soundCues is not an Array]`,
	);
});

test("should throw an error when a soundCue lacks a name", () => {
	expect(() =>
		parseSounds(__dirname, {
			name: "test-bundle",
			// @ts-expect-error
			soundCues: [{}],
		}),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: nodecg.soundCues[0] in bundle test-bundle lacks a "name" property]`,
	);
});

test("should clamp default volume to a max of 100", () => {
	const result = parseSounds(__dirname, {
		name: "test-bundle",
		soundCues: [
			{
				name: "cue",
				defaultVolume: 101,
			},
		],
	});
	expect(result.soundCues[0].defaultVolume).toBe(100);
});

test("should clamp default volume to a min of 0", () => {
	const result = parseSounds(__dirname, {
		name: "test-bundle",
		soundCues: [
			{
				name: "cue",
				defaultVolume: -1,
			},
		],
	});
	expect(result.soundCues[0].defaultVolume).toBe(0);
});

test("should throw an error when a soundCue's default file doesn't exist", () => {
	expect(() =>
		parseSounds(__dirname, {
			name: "test-bundle",
			soundCues: [
				{
					name: "cue",
					defaultFile: "nope",
				},
			],
		}),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: nodecg.soundCues[0].defaultFile in bundle test-bundle does not exist]`,
	);
});
