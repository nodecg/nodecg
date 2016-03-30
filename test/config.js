/* eslint-env node, mocha, browser */
'use strict';

const chai = require('chai');
const expect = chai.expect;
const loadConfig = require('../lib/config/loader');

describe('config loader', () => {
	it('should throw an error when the config file is not valid JSON', () => {
		expect(
			loadConfig.bind(loadConfig, 'test/specimen/cfg/invalidJSON.json')
		).to.throw(/Please ensure that it contains only valid JSON/);
	});

	it('should validate the "login" object when "login.enabled" is "true"', () => {
		expect(
			loadConfig.bind(loadConfig, 'test/specimen/cfg/invalidLogin.json')
		).to.throw(/test\/specimen\/cfg\/invalidLogin\.json is invalid/);
	});

	it('should validate the "login.steam" object when "login.steam.enabled" is "true"', () => {
		expect(
			loadConfig.bind(loadConfig, 'test/specimen/cfg/invalidSteam.json')
		).to.throw(/test\/specimen\/cfg\/invalidSteam\.json is invalid/);
	});

	it('should validate the "login.twitch" object when "login.steam.twitch" is "true"', () => {
		expect(
			loadConfig.bind(loadConfig, 'test/specimen/cfg/invalidTwitch.json')
		).to.throw(/test\/specimen\/cfg\/invalidTwitch\.json is invalid/);
	});

	it('should validate the "ssl" object when "ssl.enabled" is "true"', () => {
		expect(
			loadConfig.bind(loadConfig, 'test/specimen/cfg/invalidSSL.json')
		).to.throw(/test\/specimen\/cfg\/invalidSSL\.json is invalid/);
	});

	it('should load defaults when the config file does not exist', () => {
		const result = loadConfig('');
		expect(result.config.host).to.equal('localhost');
		expect(result.config.port).to.equal(9090);
	});
});
