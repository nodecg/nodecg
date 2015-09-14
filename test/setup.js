'use strict';

process.env.test = true;

var fs = require('fs.extra');
var webdriverio = require('webdriverio');
var e = require('./setup/test-environment');
var C = require('./setup/test-constants');

// Global before and after
before(function(done) {
    this.timeout(0);

    if (C.CONFIG.login.enabled) {
        throw new Error('Login security is enabled! '
            + 'Please disable login security in cfg/nodecg.json before running tests');
    }

    if (C.CONFIG.ssl.enabled) {
        throw new Error('SSL is enabled! Please disable SSL in cfg/nodecg.json before running tests');
    }

    // clientApi & extensionApi setup
    fs.mkdirpSync('./db/replicants/test-bundle/');
    fs.writeFileSync('./db/replicants/test-bundle/clientPersistence.rep', '"it work good!"');
    fs.writeFileSync('./db/replicants/test-bundle/clientFalseyRead.rep', '0');
    fs.writeFileSync('./db/replicants/test-bundle/extensionPersistence.rep', '"it work good!"');
    fs.writeFileSync('./db/replicants/test-bundle/extensionFalseyRead.rep', '0');

    e.server.once('started', function() {
        /** Extension API setup **/
        e.apis.extension = e.server.getExtensions()[C.BUNDLE_NAME];

        if (process.env.TRAVIS_OS_NAME && process.env.TRAVIS_JOB_NUMBER) {
            console.log('Travis environment detected, running WebDriver.io with Travis capabilities');
            var desiredCapabilities = {
                name: 'Travis job ' + process.env.TRAVIS_JOB_NUMBER,
                build: process.env.TRAVIS_BUILD_NUMBER,
                tags: [process.env.TRAVIS_BRANCH, process.env.TRAVIS_COMMIT, process.env.TRAVIS_COMMIT_RANGE],
                browserName: 'chrome',
                version: 'beta',
                tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
            };

            if (process.env.TRAVIS_PULL_REQUEST !== 'false') {
                desiredCapabilities.tags.push(process.env.TRAVIS_PULL_REQUEST);
            }

            if (process.env.TRAVIS_TAG) {
                desiredCapabilities.tags.push(process.env.TRAVIS_TAG);
            }

            if (process.env.TRAVIS_OS_NAME === 'linux') {
                desiredCapabilities.platform = 'Linux';
            } else if (process.env.TRAVIS_OS_NAME === 'osx') {
                desiredCapabilities.platform = 'OS X 10.10';
            }

            e.browser.client = webdriverio.remote({
                desiredCapabilities: desiredCapabilities,
                host: 'ondemand.saucelabs.com',
                port: 80,
                user: process.env.SAUCE_USERNAME,
                key: process.env.SAUCE_ACCESS_KEY
            });
        } else {
            console.log('Running WebDriver.io with local capabilities');
            e.browser.client = webdriverio.remote({
                desiredCapabilities: {
                    browserName: 'chrome'
                }
            });
        }

        e.browser.client
            .init()
            .timeoutsAsyncScript(30000)
            .newWindow(C.DASHBOARD_URL, 'NodeCG dashboard', '')
            .getCurrentTabId(function(err, tabId) {
                if (err) throw err;
                e.browser.tabs.dashboard = tabId;
            })
            .executeAsync(function(done) {
                var checkForApi;
                checkForApi = setInterval(function(done) {
                    if (typeof window.dashboardApi !== 'undefined') {
                        clearInterval(checkForApi);
                        done();
                    }
                }, 50, done);
            }, function(err) {
                if (err) throw err;
            })
            .newWindow(C.GRAPHIC_URL, 'NodeCG test bundle graphic', '')
            .getCurrentTabId(function(err, tabId) {
                if (err) throw err;
                e.browser.tabs.view = tabId;
            })
            .executeAsync(function(done) {
                var checkForApi;
                checkForApi = setInterval(function(done) {
                    if (typeof window.graphicApi !== 'undefined') {
                        clearInterval(checkForApi);
                        done();
                    }
                }, 50, done);
            }, function(err) {
                if (err) throw err;
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
