'use strict';

// Modules used to run tests
var Browser = require('zombie');
var config = require(process.cwd() + '/lib/config').config;

var C = require('./setup/test-constants');

var server = null;
var dashboardBrowser = null;

before(function(done) {
    this.timeout(15000);

    // Start up the server
    server = require(process.cwd() + '/server.js');

    dashboardBrowser = new Browser();
    dashboardBrowser
        .visit(C.DASHBOARD_URL)
        .then(done, done);
});

describe("dashboard", function() {
    describe("html panels", function() {
        it("show up on the dashboard", function() {
            dashboardBrowser.assert.element('#test-bundle_html');
        });
    });

    describe("jade panels", function() {
        it("show up on the dashboard", function() {
            dashboardBrowser.assert.element('#test-bundle_jade');
        });

        it("have access to bundleConfig", function() {
            dashboardBrowser.assert.text('#test-bundle_jade .js-bundleConfig', 'the_test_string');
        });

        it("have access to ncgConfig", function() {
            dashboardBrowser.assert.text('#test-bundle_jade .js-ncgConfig', config.host);
        });
    });
});

after(function() {
    try{
       server.shutdown();
    } catch(e) {}
});
