'use strict';

var Browser = require('zombie');

var e = require('./setup/test-environment');
var C = require('./setup/test-constants');

// Global before and after

before(function(done) {
    this.timeout(30000);

    if (C.CONFIG.login.enabled) {
        throw new Error('Login security is enabled! Please disable login security in cfg/nodecg.json before running tests');
    }

    if (C.CONFIG.ssl.enabled) {
        throw new Error('SSL is enabled! Please disable SSL in cfg/nodecg.json before running tests');
    }

    e.server.on('started', function() {
        var dashboardDone = false;
        var viewDone = false;
        function checkDone() {
            if (dashboardDone && viewDone) done();
        }

        /** Extension API setup **/
        e.apis.extension = e.server.getExtensions()[C.BUNDLE_NAME];

        /** Dashboard API setup **/
        // Wait until dashboard API is loaded
        function dashboardApiLoaded(window) {
            return (typeof window.dashboardApi !== 'undefined');
        }

        e.browsers.dashboard = new Browser();
        e.browsers.dashboard
            .visit(C.DASHBOARD_URL)
            .then(function() {
                e.browsers.dashboard.wait(dashboardApiLoaded, function () {
                    e.apis.dashboard = e.browsers.dashboard.window.dashboardApi;
                    if (typeof e.apis.dashboard === 'undefined') {
                        throw new Error('Dashboard API is undefined!');
                    }
                    dashboardDone = true;
                    checkDone();
                });
            });

        /** View API setup **/
        // Wait until view API is loaded
        function viewApiLoaded(window) {
            return (typeof window.viewApi !== 'undefined');
        }

        // Zombie doesn't set referers itself when requesting assets on a page
        // For this reason, there is a workaround in lib/bundle_views
        e.browsers.view = new Browser();
        e.browsers.view
            .visit(C.VIEW_URL)
            .then(function() {
                e.browsers.view.wait(viewApiLoaded, function () {
                    e.apis.view = e.browsers.view.window.viewApi;
                    viewDone = true;
                    checkDone();
                });
            });
    });
    e.server.start();
});

after(function() {
    try{
        e.server.stop();
    } catch(e) {}
});
