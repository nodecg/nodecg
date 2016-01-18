/* jshint -W030 */
'use strict';

var chai = require('chai');
var expect = chai.expect;
var e = require('./setup/test-environment');

describe('dashboard', function() {
    this.timeout(10000);

    describe('panels', function() {
        it('should show up on the dashboard', function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .isExisting('ncg-dashboard-panel[bundle="test-bundle"][panel="test"]')
                .then(function(isExisting) {
                    expect(isExisting).to.be.true;
                    done();
                });
        });
    });
});
