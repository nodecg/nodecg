'use strict';

// Modules used to run tests
var Browser = require('zombie');
var config = require(process.cwd() + '/lib/config').config;

var C = require('./setup/test-constants');
var e = require('./setup/test-environment');

var dashboardBrowser = null;

describe("dashboard", function() {
    before(function(done) {
        this.timeout(15000);

        dashboardBrowser = new Browser();
        dashboardBrowser
            .visit(C.DASHBOARD_URL)
            .then(done, done);
    });

    describe("html panels", function() {
        it("show up on the dashboard", function() {
            dashboardBrowser.assert.element('.test-bundle.html');
        });
    });

    describe("jade panels", function() {
        it("show up on the dashboard", function() {
            dashboardBrowser.assert.element('.test-bundle.jade');
        });

        it("have access to bundleConfig", function() {
            dashboardBrowser.assert.text('.test-bundle.jade .js-bundleConfig', 'the_test_string');
        });

        it("have access to ncgConfig", function() {
            dashboardBrowser.assert.text('.test-bundle.jade .js-ncgConfig', config.host);
        });
    });
});
