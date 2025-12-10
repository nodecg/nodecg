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

test("should parse graphics with name and description fields", () => {
	const parsedBundle = parseBundle(
		"./test/fixtures/bundle-parser/graphics-with-metadata",
	);
	expect(parsedBundle.graphics).toHaveLength(2);

	// Check graphic with name and description
	const namedGraphic = parsedBundle.graphics.find(
		(g) => g.file === "overlay.html",
	);
	expect(namedGraphic).toBeDefined();
	expect(namedGraphic!.name).toBe("Game Overlay");
	expect(namedGraphic!.description).toBe(
		"Main overlay displaying game state and scores",
	);
	expect(namedGraphic!.width).toBe(1920);
	expect(namedGraphic!.height).toBe(1080);

	// Check graphic without name and description
	const simpleGraphic = parsedBundle.graphics.find(
		(g) => g.file === "simple.html",
	);
	expect(simpleGraphic).toBeDefined();
	expect(simpleGraphic!.name).toBeUndefined();
	expect(simpleGraphic!.description).toBeUndefined();
	expect(simpleGraphic!.width).toBe(800);
	expect(simpleGraphic!.height).toBe(600);
});

test("should handle graphics with only name field", () => {
	const parsedBundle = parseBundle(
		"./test/fixtures/bundle-parser/graphics-name-only",
	);
	expect(parsedBundle.graphics).toHaveLength(1);

	const graphic = parsedBundle.graphics[0]!;
	expect(graphic.name).toBe("Named Graphic");
	expect(graphic.description).toBeUndefined();
	expect(graphic.width).toBe(1280);
	expect(graphic.height).toBe(720);
});

test("should handle graphics with only description field", () => {
	const parsedBundle = parseBundle(
		"./test/fixtures/bundle-parser/graphics-description-only",
	);
	expect(parsedBundle.graphics).toHaveLength(1);

	const graphic = parsedBundle.graphics[0]!;
	expect(graphic.name).toBeUndefined();
	expect(graphic.description).toBe("A graphic with only description");
	expect(graphic.width).toBe(1024);
	expect(graphic.height).toBe(768);
});

test("should parse graphics with order values for sorting stability", () => {
	const parsedBundle = parseBundle(
		"./test/fixtures/bundle-parser/graphics-with-metadata",
	);
	expect(parsedBundle.graphics).toHaveLength(2);

	// Both graphics should have order values for testing sorting stability
	const overlayGraphic = parsedBundle.graphics.find(
		(g) => g.file === "overlay.html",
	);
	const simpleGraphic = parsedBundle.graphics.find(
		(g) => g.file === "simple.html",
	);

	expect(overlayGraphic).toBeDefined();
	expect(simpleGraphic).toBeDefined();

	// The fixture should have order values set to test identical order sorting
	expect(overlayGraphic!.order).toBe(1);
	expect(simpleGraphic!.order).toBe(1);
});
