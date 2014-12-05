'use strict';

// Modules used to run tests
var Browser = require('zombie');

var C = require('./setup/test-constants');

var server = null;
var dashboardBrowser = null;

before(function(done) {
    this.timeout(10000);

    // Start up the server
    server = require(process.cwd() + '/server.js');

    dashboardBrowser = new Browser();
    dashboardBrowser
        .visit(C.DASHBOARD_URL)
        .then(done, done);
});

describe("panels", function() {
    it("if Jade, have access to bundleConfig", function() {
        dashboardBrowser.assert.text('#test-bundle .js-test', 'the_test_string');
    });
});

after(function() {
    try{
       server.shutdown();
    } catch(e) {}
});
