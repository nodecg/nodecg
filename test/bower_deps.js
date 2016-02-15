/* eslint-env node, mocha, browser */
'use strict';

var chai = require('chai');
var expect = chai.expect;
var request = require('request');
var C = require('./setup/test-constants');

describe('per-bundle bower dependencies', function () {
	it('should be accessible via /panel', function (done) {
		request(C.PANEL_COMPONENTS_URL + '/webcomponentsjs/webcomponents.js', function (error, response) {
			expect(error).to.be.null();
			expect(response.statusCode).to.equal(200);
			done();
		});
	});

	it('should be accessible via /graphics', function (done) {
		request(C.GRAPHIC_URL + '/components/webcomponentsjs/webcomponents.js', function (error, response) {
			expect(error).to.be.null();
			expect(response.statusCode).to.equal(200);
			done();
		});
	});
});
