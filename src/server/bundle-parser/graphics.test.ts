import { expect, test } from "vitest";

import { parseBundle } from ".";

test('when there is no "graphics" folder, assign an empty array to bundle.graphics', () => {
	const parsedBundle = parseBundle("./test/fixtures/bundle-parser/no-graphics");
	expect(parsedBundle.graphics).toEqual([]);
});

test('when there is a "graphics" folder but no "graphics" property, throw an error', () => {
	expect(
		parseBundle.bind(
			parseBundle,
			"./test/fixtures/bundle-parser/no-graphics-prop",
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: no-graphics-prop has a "graphics" folder, but no "nodecg.graphics" property was found in its package.json]`,
	);
});

test('when there is a "graphics" property but no "graphics" folder, throw an error', () => {
	expect(
		parseBundle.bind(
			parseBundle,
			"./test/fixtures/bundle-parser/no-graphics-folder",
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: no-graphics-folder has a "nodecg.graphics" property in its package.json, but no "graphics" folder]`,
	);
});

test('when critical properties are missing from the "graphics" property, throw an error explaining what is missing', () => {
	expect(
		parseBundle.bind(
			parseBundle,
			"./test/fixtures/bundle-parser/missing-graphic-props",
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: Graphic #0 could not be parsed as it is missing the following properties: file, width, height]`,
	);
});

test("when two graphics have the same file, throw an error", () => {
	expect(
		parseBundle.bind(
			parseBundle,
			"./test/fixtures/bundle-parser/dupe-graphic-file",
		),
	).toThrowErrorMatchingInlineSnapshot(
		`[Error: Graphic #1 (index.html) has the same file as another graphic in dupe-graphic-file]`,
	);
});
