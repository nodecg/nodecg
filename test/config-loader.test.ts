import { expect, test } from "vitest";

import { loadConfig } from "../src/server/config/loader";

test("should throw an error when the config file is not valid JSON", () => {
	expect(
		loadConfig.bind(
			loadConfig,
			"test/fixtures/nodecg-core/cfg/invalidJSON.json",
		),
	).toThrow(/^JSON Error in/);
});

test('should validate the "login" object when "login.enabled" is "true"', () => {
	expect(
		loadConfig.bind(
			loadConfig,
			"test/fixtures/nodecg-core/cfg/invalidLogin.json",
		),
	).toThrow('"login.sessionSecret" must be a string');
});

test('should validate the "login.steam" object when "login.steam.enabled" is "true"', () => {
	expect(
		loadConfig.bind(
			loadConfig,
			"test/fixtures/nodecg-core/cfg/invalidSteam.json",
		),
	).toThrow('"login.steam.apiKey" must be a string');
});

test('should validate the "login.twitch" object when "login.twitch.enabled" is "true"', () => {
	expect(
		loadConfig.bind(
			loadConfig,
			"test/fixtures/nodecg-core/cfg/invalidTwitch.json",
		),
	).toThrow('"login.twitch.clientID" must be a string');
});

test('should validate the "login.discord" object when "login.discord.enabled" is "true"', () => {
	expect(
		loadConfig.bind(
			loadConfig,
			"test/fixtures/nodecg-core/cfg/invalidDiscord.json",
		),
	).toThrow('"login.discord.clientID" must be a string');
});

test('should validate the "ssl" object when "ssl.enabled" is "true"', () => {
	expect(
		loadConfig.bind(
			loadConfig,
			"test/fixtures/nodecg-core/cfg/invalidSSL.json",
		),
	).toThrow('"ssl.keyPath" must be a string');
});

test("should load defaults when the config file does not exist", () => {
	const result = loadConfig("test/fixtures/nodecg-core/cfg");
	expect(result.config.host).toBe("0.0.0.0");
	expect(result.config.port).toBe(9090);
});

test("should not have any whitelisted nor blacklisted bundles by default", () => {
	const result = loadConfig("test/fixtures/nodecg-core/cfg");
	expect(result.config.bundles.enabled).toBe(null);
	expect(result.config.bundles.disabled).toBe(null);
});

test("should support YAML configs", () => {
	const result = loadConfig("test/fixtures/nodecg-core/cfg-yaml");
	expect(result.config.host).toBe("yaml-config");
});

test("should support CommonJS configs", () => {
	const result = loadConfig("test/fixtures/nodecg-core/cfg-js");
	expect(result.config.host).toBe("js-config");
});
