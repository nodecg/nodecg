/* eslint-env node, mocha, browser */
'use strict';

const chai = require('chai');
const expect = chai.expect;
const e = require('./setup/test-environment');

describe('dashboard', function () {
	this.timeout(10000);

	describe('panels', () => {
		it('should show up on the dashboard', done => {
			e.browser.client
				.switchTab(e.browser.tabs.dashboard)
				.isExisting('ncg-dashboard-panel[bundle="test-bundle"][panel="test"]')
				.then(isExisting => {
					expect(isExisting).to.be.true();
					done();
				});
		});
	});
});
