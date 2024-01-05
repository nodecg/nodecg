import test from 'ava';
import { loadConfig } from '../src/server/config/loader';

test('should throw an error when the config file is not valid JSON', (t) => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidJSON.json'));
	if (!error) return t.fail();
	return t.regex(error.message, /^JSON Error in/);
});

test('should validate the "login" object when "login.enabled" is "true"', (t) => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidLogin.json'));
	if (!error) return t.fail();
	return t.is(error.message, '"login.sessionSecret" must be a string');
});

test('should validate the "login.steam" object when "login.steam.enabled" is "true"', (t) => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidSteam.json'));
	if (!error) return t.fail();
	return t.is(error.message, '"login.steam.apiKey" must be a string');
});

test('should validate the "login.twitch" object when "login.twitch.enabled" is "true"', (t) => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidTwitch.json'));
	if (!error) return t.fail();
	return t.is(error.message, '"login.twitch.clientID" must be a string');
});

test('should validate the "login.discord" object when "login.discord.enabled" is "true"', (t) => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidDiscord.json'));
	if (!error) return t.fail();
	return t.is(error.message, '"login.discord.clientID" must be a string');
});

test('should validate the "ssl" object when "ssl.enabled" is "true"', (t) => {
	const error = t.throws(loadConfig.bind(loadConfig, 'test/fixtures/nodecg-core/cfg/invalidSSL.json'));
	if (!error) return t.fail();
	return t.is(error.message, '"ssl.keyPath" must be a string');
});

test('should load defaults when the config file does not exist', (t) => {
	const result = loadConfig('test/fixtures/nodecg-core/cfg');
	t.is(result.config.host, '0.0.0.0');
	t.is(result.config.port, 9090);
});

test('should not have any whitelisted nor blacklisted bundles by default', (t) => {
	const result = loadConfig('test/fixtures/nodecg-core/cfg');
	t.is(result.config.bundles.enabled, null);
	t.is(result.config.bundles.disabled, null);
});

test('should support YAML configs', (t) => {
	const result = loadConfig('test/fixtures/nodecg-core/cfg-yaml');
	t.is(result.config.host, 'yaml-config');
});

test('should support CommonJS configs', (t) => {
	const result = loadConfig('test/fixtures/nodecg-core/cfg-js');
	t.is(result.config.host, 'js-config');
});
