'use strict';

// Modules used to run tests
var config = require(process.cwd() + '/lib/config').getConfig();
var chai = require('chai');
var expect = chai.expect;

var e = require('./setup/test-environment');

describe('dashboard', function() {
    this.timeout(10000);

    before(function() {
        e.browser.client
            .switchTab(e.browser.tabs.dashboard);
    });

    describe('jade panels', function() {
        it('show up on the dashboard', function(done) {
            e.browser.client
                .isExisting('#test-bundle_test', function(err, isExisting) {
                    if (err) {
                        throw err;
                    }

                    expect(isExisting).to.be.true;
                })
                .call(done);
        });

        it('have access to bundleConfig', function(done) {
            e.browser.client
                .frame('test-bundle_test')
                .getText('#bundleConfig', function(err, text) {
                    console.log('got that bundleConfig', text);
                    if (err) {
                        throw err;
                    }

                    expect(text).to.equal('the_test_string');
                })
                .frame(null)
                .call(done);
        });

        it('have access to bundleName', function(done) {
            e.browser.client
                .frame('test-bundle_test')
                .getText('#bundleName', function(err, text) {
                    if (err) {
                        throw err;
                    }

                    expect(text).to.equal('test-bundle');
                })
                .frame(null)
                .call(done);
        });

        it('have access to ncgConfig', function(done) {
            e.browser.client
                .frame('test-bundle_test')
                .getText('#ncgConfig', function(err, text) {
                    if (err) {
                        throw err;
                    }

                    expect(text).to.equal(config.host);
                })
                .frame(null)
                .call(done);
        });
    });
});
