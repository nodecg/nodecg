'use strict';

// Modules used to run tests
var config = require(process.cwd() + '/lib/config').getConfig();
var chai = require('chai');
var expect = chai.expect;

var e = require('./setup/test-environment');

describe('dashboard', function() {
    describe('html panels', function() {
        it('show up on the dashboard', function(done) {
            e.browsers.dashboard
                .isExisting('.test-bundle.html', function(err, isExisting) {
                    expect(isExisting).to.be.true;
                })
                .call(done);
        });
    });

    describe('jade panels', function() {
        it('show up on the dashboard', function(done) {
            e.browsers.dashboard
                .isExisting('.test-bundle.jade', function(err, isExisting) {
                    expect(isExisting).to.be.true;
                })
                .call(done);
        });

        it('have access to bundleConfig', function(done) {
            e.browsers.dashboard
                .getText('.test-bundle.jade .js-bundleConfig', function(err, text) {
                    expect(text).to.equal('the_test_string');
                })
                .call(done);
        });

        it('have access to bundleName', function(done) {
            e.browsers.dashboard
                .getText('.test-bundle.jade .js-bundleName', function(err, text) {
                    expect(text).to.equal('test-bundle');
                })
                .call(done);
        });

        it('have access to ncgConfig', function(done) {
            e.browsers.dashboard
                .getText('.test-bundle.jade .js-ncgConfig', function(err, text) {
                    expect(text).to.equal(config.host);
                })
                .call(done);
        });
    });
});
