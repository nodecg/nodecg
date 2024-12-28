import fs from "node:fs";

import { expect, test } from "vitest";

import { parseBundle } from "../../src/server/bundle-parser";

test("parsing - when the config file exists, parse the config and add it as bundle.config", () => {
	const parsedBundle = parseBundle(
		"./test/fixtures/bundle-parser/good-bundle",
		JSON.parse(
			fs.readFileSync(
				"./test/fixtures/bundle-parser/good-bundle/bundleConfig.json",
				"utf8",
			),
		),
	);
	expect(parsedBundle.config).toEqual({ foo: "foo" });
});

test("parsing - when the config file exists, set default values if the config doesn't define them", () => {
	const parsedBundle = parseBundle(
		"./test/fixtures/bundle-parser/config-defaults",
	);
	expect(parsedBundle.config).toEqual({ foo: "foo" });
});

test("parsing - when the config file exists, should not reject a config if it doesn't provide a value, but the schema provides a default", () => {
	const parsedBundle = parseBundle(
		"./test/fixtures/bundle-parser/required-defaults",
		JSON.parse(
			fs.readFileSync(
				"./test/fixtures/bundle-parser/required-defaults/bundleConfig.json",
				"utf8",
			),
		),
	);
	expect(parsedBundle.config).toEqual({ foo: "foo", bar: "bar" });
});

test("validation - when the schema file exists, should not throw when the config passes validation", () => {
	const fn = parseBundle.bind(
		parseBundle,
		"./test/fixtures/bundle-parser/config-validation",
		JSON.parse(
			fs.readFileSync(
				"./test/fixtures/bundle-parser/config-validation/validConfig.json",
				"utf8",
			),
		),
	);
	expect(fn).not.toThrow();
});

test("validation - when the schema file exists, should throw when the config fails validation", () => {
	const fn = parseBundle.bind(
		parseBundle,
		"./test/fixtures/bundle-parser/config-validation",
		JSON.parse(
			fs.readFileSync(
				"./test/fixtures/bundle-parser/config-validation/invalidConfig.json",
				"utf8",
			),
		),
	);
	expect(fn).toThrowErrorMatchingInlineSnapshot(`
		[Error: Config for bundle "config-validation" is invalid:
		foo must be string]
	`);
});

// Smoke test for https://github.com/chute/json-schema-defaults/issues/10
test("validation - when the schema file exists, properly merge configs that have arrays of objects", () => {
	const parsedBundle = parseBundle(
		"./test/fixtures/bundle-parser/config-schema-array-of-objects",
		JSON.parse(
			fs.readFileSync(
				"./test/fixtures/bundle-parser/config-schema-array-of-objects/bundleConfig.json",
				"utf8",
			),
		),
	);
	expect(parsedBundle.config).toMatchInlineSnapshot(`
		{
		  "gameAudioChannels": [
		    {
		      "hd": 25,
		      "sd": 17,
		    },
		    {
		      "hd": 27,
		      "sd": 19,
		    },
		    {
		      "hd": null,
		      "sd": 21,
		    },
		    {
		      "hd": null,
		      "sd": 23,
		    },
		  ],
		}
	`);
});

test("validation - when the schema file does not exist, skip validation and not throw an error", () => {
	const fn = parseBundle.bind(
		parseBundle,
		"./test/fixtures/bundle-parser/good-bundle",
		JSON.parse(
			fs.readFileSync(
				"./test/fixtures/bundle-parser/good-bundle/bundleConfig.json",
				"utf8",
			),
		),
	);
	expect(fn).not.toThrow();
});

test("validation - when the schema file isn't valid JSON, throw an error", () => {
	const fn = parseBundle.bind(
		parseBundle,
		"./test/fixtures/bundle-parser/bad-schema",
		JSON.parse(
			fs.readFileSync(
				"./test/fixtures/bundle-parser/bad-schema/bundleConfig.json",
				"utf8",
			),
		),
	);
	expect(fn).toThrowErrorMatchingInlineSnapshot(
		`[Error: configschema.json for bundle "bad-schema" could not be read. Ensure that it is valid JSON.]`,
	);
});

test("validation - should not reject a config if it doesn't an optional object that has some properties with defaults and other required properties that do not have defaults", () => {
	const parsedBundle = parseBundle(
		"./test/fixtures/bundle-parser/optional-object-with-required-props-and-defaults",
		JSON.parse(
			fs.readFileSync(
				"./test/fixtures/bundle-parser/optional-object-with-required-props-and-defaults/bundleConfig.json",
				"utf8",
			),
		),
	);
	expect(parsedBundle.config).toEqual({});
});
