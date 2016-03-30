/* eslint-env node, mocha, browser */
'use strict';

const chai = require('chai');
const expect = chai.expect;
const request = require('request');
const C = require('./setup/test-constants');

describe('per-bundle bower dependencies', () => {
	it('should be accessible via /panel', done => {
		request(`${C.PANEL_COMPONENTS_URL}/webcomponentsjs/webcomponents.js`, (error, response) => {
			expect(error).to.be.null();
			expect(response.statusCode).to.equal(200);
			done();
		});
	});

	it('should be accessible via /graphics', done => {
		request(`${C.GRAPHIC_URL}/components/webcomponentsjs/webcomponents.js`, (error, response) => {
			expect(error).to.be.null();
			expect(response.statusCode).to.equal(200);
			done();
		});
	});
});
