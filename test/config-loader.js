'use strict';

// Packages
const test = require('ava');

// Ours
const loadConfig = require('../lib/config/loader');

test('should throw an error when the config file is not valid JSON', t => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidJSON.json'));
	t.true(error.message.includes('Please ensure that it contains only valid JSON'));
});

test('should validate the "login" object when "login.enabled" is "true"', t => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidLogin.json'));
	t.is(error.message, 'login.sessionSecret: must be of type String');
});

test('should validate the "login.steam" object when "login.steam.enabled" is "true"', t => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidSteam.json'));
	t.is(error.message, 'login.steam.apiKey: must be of type String');
});

test('should validate the "login.twitch" object when "login.steam.twitch" is "true"', t => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidTwitch.json'));
	t.is(error.message, 'login.twitch.clientID: must be of type String\nlogin.twitch.clientSecret: must be of type String');
});

test('should validate the "ssl" object when "ssl.enabled" is "true"', t => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidSSL.json'));
	t.is(error.message, 'ssl.keyPath: must be of type String\nssl.certificatePath: must be of type String');
});

test('should load defaults when the config file does not exist', t => {
	const result = loadConfig('');
	t.is(result.config.host, '0.0.0.0');
	t.is(result.config.port, 9090);
});

test('should not have any whitelisted nor blacklisted bundles by default', t => {
	const result = loadConfig('');
	t.is(result.config.bundles.enabled, null);
	t.is(result.config.bundles.disabled, null);
});
