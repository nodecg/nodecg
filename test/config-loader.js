'use strict';

// Packages
const test = require('ava');

// Ours
const loadConfig = require('../lib/config/loader');

test('should throw an error when the config file is not valid JSON', t => {
	const error = t.throws(
		loadConfig.bind(loadConfig, 'test/fixtures/cfg/invalidJSON.json')
	);

	t.true(error.message.includes('Please ensure that it contains only valid JSON'));
});

test('should validate the "login" object when "login.enabled" is "true"', t => {
	const error = t.throws(
		loadConfig.bind(loadConfig, 'test/fixtures/cfg/invalidLogin.json')
	);

	t.true(error.message.includes('test/fixtures/cfg/invalidLogin.json is invalid'));
});

test('should validate the "login.steam" object when "login.steam.enabled" is "true"', t => {
	const error = t.throws(
		loadConfig.bind(loadConfig, 'test/fixtures/cfg/invalidSteam.json')
	);

	t.true(error.message.includes('test/fixtures/cfg/invalidSteam.json is invalid'));
});

test('should validate the "login.twitch" object when "login.steam.twitch" is "true"', t => {
	const error = t.throws(
		loadConfig.bind(loadConfig, 'test/fixtures/cfg/invalidTwitch.json')
	);

	t.true(error.message.includes('test/fixtures/cfg/invalidTwitch.json is invalid'));
});

test('should validate the "ssl" object when "ssl.enabled" is "true"', t => {
	const error = t.throws(
		loadConfig.bind(loadConfig, 'test/fixtures/cfg/invalidSSL.json')
	);

	t.true(error.message.includes('est/fixtures/cfg/invalidSSL.json is invalid'));
});

test('should load defaults when the config file does not exist', t => {
	const result = loadConfig('');
	t.is(result.config.host, '0.0.0.0');
	t.is(result.config.port, 9090);
});

test('should not have any disabled bundles by default', t => {
	const result = loadConfig('');
	t.is(result.config.bundles.disabled, null);
});
