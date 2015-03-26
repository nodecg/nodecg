'use strict';

// Modules used to run tests
var config = require(process.cwd() + '/lib/config').getConfig();

var e = require('./setup/test-environment');

describe('dashboard', function() {
    describe('html panels', function() {
        it('show up on the dashboard', function() {
            e.browsers.dashboard.assert.element('.test-bundle.html');
        });
    });

    describe('jade panels', function() {
        it('show up on the dashboard', function() {
            e.browsers.dashboard.assert.element('.test-bundle.jade');
        });

        it('have access to bundleConfig', function() {
            e.browsers.dashboard.assert.text('.test-bundle.jade .js-bundleConfig', 'the_test_string');
        });

        it('have access to bundleName', function() {
            e.browsers.dashboard.assert.text('.test-bundle.jade .js-bundleName', 'test-bundle');
        });

        it('have access to ncgConfig', function() {
            e.browsers.dashboard.assert.text('.test-bundle.jade .js-ncgConfig', config.host);
        });
    });
});
