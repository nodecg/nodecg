'use strict';

var webdriverio = require('webdriverio');

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

    e.server.once('started', function() {
        /** Extension API setup **/
        e.apis.extension = e.server.getExtensions()[C.BUNDLE_NAME];

        e.browsers.dashboard = webdriverio.remote({
            desiredCapabilities: {
                tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
            },
            host: 'ondemand.saucelabs.com',
            port: 80,
            user: process.env.SAUCE_USERNAME,
            key: process.env.SAUCE_ACCESS_KEY
        }).init();

        e.browsers.dashboard
            .url(C.DASHBOARD_URL);

        // Zombie doesn't set referers itself when requesting assets on a page
        // For this reason, there is a workaround in lib/bundle_views
        e.browsers.view = webdriverio.remote({
            desiredCapabilities: {
                tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
            },
            host: 'ondemand.saucelabs.com',
            port: 80,
            user: process.env.SAUCE_USERNAME,
            key: process.env.SAUCE_ACCESS_KEY
        }).init();

        e.browsers.view
            .url(C.VIEW_URL);

        done();
    });
    e.server.start();
});

after(function() {
    try{
        e.server.stop();
        e.browsers.dashboard.end();
        e.browsers.view.end();
    } catch(e) {}
});
