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

        e.browser.client = webdriverio.remote({
            desiredCapabilities: {
                browserName: 'chrome',
                version: 'b',
                tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
            },
            host: 'ondemand.saucelabs.com',
            port: 80,
            user: process.env.SAUCE_USERNAME,
            key: process.env.SAUCE_ACCESS_KEY
        })
            .init()
            .newWindow(C.DASHBOARD_URL, 'NodeCG dashboard', '')
            .getCurrentTabId(function(err, tabId) {
                if (err) {
                    throw err;
                }

                e.browser.tabs.dashboard = tabId;
            })
            .newWindow(C.VIEW_URL, 'NodeCG test bundle view', '')
            .getCurrentTabId(function(err, tabId) {
                if (err) {
                    throw err;
                }

                e.browser.tabs.view = tabId;
            })
            .timeoutsAsyncScript(5000)
            .call(done);
    });
    e.server.start();
});

after(function() {
    e.server.stop();
    e.browser.client.end();
});
