'use strict';

// Packages
const test = require('ava');

// Ours
const parseBundle = require('../../lib/bundle-parser');

test('parsing - when the config file exists, parse the config and add it as bundle.config', t => {
	const parsedBundle = parseBundle(
		'./test/fixtures/bundle-parser/good-bundle',
		'./test/fixtures/bundle-parser/good-bundle/bundleConfig.json'
	);
	t.deepEqual(parsedBundle.config, {foo: 'foo'});
});

test('parsing - when the config file exists, set default values if the config doesn\'t define them', t => {
	const parsedBundle = parseBundle('./test/fixtures/bundle-parser/config-defaults');
	t.deepEqual(parsedBundle.config, {foo: 'foo'});
});

test('parsing - when the config file exists, should not reject a config if it doesn\'t provide a value, but the schema provides a default', t => {
	const parsedBundle = parseBundle(
		'./test/fixtures/bundle-parser/required-defaults',
		'./test/fixtures/bundle-parser/required-defaults/bundleConfig.json'
	);
	t.deepEqual(parsedBundle.config, {foo: 'foo', bar: 'bar'});
});

test('parsing - when the config file does not exist, throw an error', t => {
	const error = t.throws(parseBundle.bind(
		parseBundle,
		'./test/fixtures/bundle-parser/good-bundle',
		'./made/up/path.json'
	));
	t.true(error.message.includes('does not exist'));
});

test('parsing when the config file isn\'t valid JSON, throw an error', t => {
	const fn = parseBundle.bind(
		parseBundle,
		'./test/fixtures/bundle-parser/bad-json',
		'./test/fixtures/bundle-parser/bad-json/bundleConfig.json'
	);
	const error = t.throws(fn);
	t.true(error.message.includes('Ensure that it is valid JSON'));
});

test('validation - when the schema file exists, should not throw when the config passes validation', t => {
	const fn = parseBundle.bind(
		parseBundle,
		'./test/fixtures/bundle-parser/config-validation',
		'./test/fixtures/bundle-parser/config-validation/validConfig.json'
	);
	t.notThrows(fn);
});

test('validation - when the schema file exists, should throw when the config fails validation', t => {
	const fn = parseBundle.bind(
		parseBundle,
		'./test/fixtures/bundle-parser/config-validation',
		'./test/fixtures/bundle-parser/config-validation/invalidConfig.json'
	);
	const error = t.throws(fn);
	t.true(error.message.includes('is invalid:'));
});

// Smoke test for https://github.com/chute/json-schema-defaults/issues/10
test('validation - when the schema file exists, properly merge configs that have arrays of objects', t => {
	const parsedBundle = parseBundle(
		'./test/fixtures/bundle-parser/config-schema-array-of-objects',
		'./test/fixtures/bundle-parser/config-schema-array-of-objects/bundleConfig.json'
	);
	t.deepEqual(parsedBundle.config, {
		gameAudioChannels: [
			{sd: 17, hd: 25},
			{sd: 19, hd: 27},
			{sd: 21, hd: null},
			{sd: 23, hd: null}
		]
	});
});

test('validation - when the schema file does not exist, skip validation and not throw an error', t => {
	const fn = parseBundle.bind(
		parseBundle,
		'./test/fixtures/bundle-parser/good-bundle',
		'./test/fixtures/bundle-parser/good-bundle/bundleConfig.json'
	);
	t.notThrows(fn);
});

test('validation - when the schema file isn\'t valid JSON, throw an error', t => {
	const fn = parseBundle.bind(
		parseBundle,
		'./test/fixtures/bundle-parser/bad-schema',
		'./test/fixtures/bundle-parser/bad-schema/bundleConfig.json'
	);
	const error = t.throws(fn);
	t.true(error.message.includes('configschema.json for bundle '));
});

test('validation - should not reject a config if it doesn\'t an optional object that has some properties with defaults and other required properties that do not have defaults', t => {
	const parsedBundle = parseBundle(
		'./test/fixtures/bundle-parser/optional-object-with-required-props-and-defaults',
		'./test/fixtures/bundle-parser/optional-object-with-required-props-and-defaults/bundleConfig.json'
	);
	t.deepEqual(parsedBundle.config, {});
});
