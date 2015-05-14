'use strict';

// Modules used to run tests
var config = require(process.cwd() + '/lib/config').getConfig();
var chai = require('chai');
var expect = chai.expect;

var e = require('./setup/test-environment');

describe('dashboard', function() {
    this.timeout(10000);

    describe('html panels', function() {
        it('show up on the dashboard', function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .isExisting('.test-bundle.html', function(err, isExisting) {
                    if (err) {
                        throw err;
                    }

                    expect(isExisting).to.be.true;
                })
                .call(done);
        });
    });
});
