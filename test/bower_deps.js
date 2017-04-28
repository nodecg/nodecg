/* eslint-env node, mocha, browser */
'use strict';

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const request = require('request');
const C = require('./setup/test-constants');

describe('per-bundle bower dependencies', () => {
	it('should be accessible via /bundle/:bundleName/bower_components', done => {
		request(`${C.BUNDLE_BOWER_COMPONENTS_URL}/webcomponentsjs/webcomponents.js`, (error, response) => {
			assert.isNull(error);
			expect(response.statusCode).to.equal(200);
			done();
		});
	});
});
