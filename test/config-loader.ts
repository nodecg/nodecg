// Packages
import test from 'ava';

// Ours
const loadConfig = require('../src/server/config/loader').default;

test('should throw an error when the config file is not valid JSON', t => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidJSON.json'));
	t.regex(error.message, /^JSON Error in/);
});

test('should validate the "login" object when "login.enabled" is "true"', t => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidLogin.json'));
	t.is(error.message, '"sessionSecret" must be a string');
});

test('should validate the "login.steam" object when "login.steam.enabled" is "true"', t => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidSteam.json'));
	t.is(error.message, '"apiKey" must be a string');
});

test('should validate the "login.twitch" object when "login.steam.twitch" is "true"', t => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidTwitch.json'));
	t.is(error.message, '"clientID" must be a string');
});

test('should validate the "ssl" object when "ssl.enabled" is "true"', t => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidSSL.json'));
	t.is(error.message, '"keyPath" must be a string');
});

test('should load defaults when the config file does not exist', t => {
	const result = loadConfig('test/fixtures/nodecg-core/cfg');
	t.is(result.config.host, '0.0.0.0');
	t.is(result.config.port, 9090);
});

test('should not have any whitelisted nor blacklisted bundles by default', t => {
	const result = loadConfig('test/fixtures/nodecg-core/cfg');
	t.is(result.config.bundles.enabled, null);
	t.is(result.config.bundles.disabled, null);
});
