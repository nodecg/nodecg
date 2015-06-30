/* jshint -W030 */
'use strict';

var config = require(process.cwd() + '/lib/config').getConfig();
var chai = require('chai');
var expect = chai.expect;
var e = require('./setup/test-environment');

describe('dashboard', function() {
    this.timeout(10000);

    describe('panels', function() {
        context('when written in HTML', function() {
            it('should show up on the dashboard', function(done) {
                e.browser.client
                    .switchTab(e.browser.tabs.dashboard)
                    .isExisting('.test-bundle.html', function(err, isExisting) {
                        if (err) throw err;
                        expect(isExisting).to.be.true;
                    })
                    .call(done);
            });
        });

        context('when written in Jade', function() {
            it('should show up on the dashboard', function(done) {
                e.browser.client
                    .switchTab(e.browser.tabs.dashboard)
                    .isExisting('.test-bundle.jade', function(err, isExisting) {
                        if (err) throw err;
                        expect(isExisting).to.be.true;
                    })
                    .call(done);
            });

            it('should have access to bundleConfig', function(done) {
                e.browser.client
                    .switchTab(e.browser.tabs.dashboard)
                    .getText('.test-bundle.jade .js-bundleConfig', function(err, text) {
                        if (err) throw err;
                        expect(text).to.equal('the_test_string');
                    })
                    .call(done);
            });

            it('should have access to bundleName', function(done) {
                e.browser.client
                    .switchTab(e.browser.tabs.dashboard)
                    .getText('.test-bundle.jade .js-bundleName', function(err, text) {
                        if (err) throw err;
                        expect(text).to.equal('test-bundle');
                    })
                    .call(done);
            });

            it('should have access to ncgConfig', function(done) {
                e.browser.client
                    .switchTab(e.browser.tabs.dashboard)
                    .getText('.test-bundle.jade .js-ncgConfig', function(err, text) {
                        if (err) throw err;
                        expect(text).to.equal(config.host);
                    })
                    .call(done);
            });
        });
    });
});
