// Modules used to run tests
var assert = require('assert');
var Browser = require('zombie');

// Modules needed to set up test environment
var util = require('util');
var path = require('path');
var config = require(process.cwd() + '/lib/config').config;

var BUNDLE_NAME = 'test-bundle';
var DASHBOARD_URL = util.format("http://%s:%d/", config.host, config.port);
var VIEW_URL = DASHBOARD_URL + 'view/' + BUNDLE_NAME;

var server = null;
var dashboardBrowser = null;
var viewBrowser = null;
var extensionApi = null;
var dashboardApi = null;
var viewApi = null;

before(function(done) {
    var self = this;
    this.timeout(20000);

    var dashboardDone = false;
    var viewDone = false;
    function checkDone() {
        if (dashboardDone && viewDone) done();
    }

    // Start up the server
    server = require(process.cwd() + '/server.js');

    server.emitter.on('extensionsLoaded', function extensionsLoaded() {
        /** Extension API setup **/
        extensionApi = server.extensions[BUNDLE_NAME];

        /** Dashboard API setup **/
        // Wait until dashboard API is loaded
        function dashboardApiLoaded(window) {
            return (typeof window.dashboardApi !== "undefined");
        }

        dashboardBrowser = new Browser();
        dashboardBrowser
            .visit(DASHBOARD_URL)
            .then(function() {
                dashboardBrowser.wait(dashboardApiLoaded, function () {
                    dashboardApi = dashboardBrowser.window.dashboardApi;
                    dashboardDone = true;
                    checkDone();
                });
            });

        /** View API setup **/
        // Wait until view API is loaded
        function viewApiLoaded(window) {
            //return (typeof window.NodeCG !== "undefined");
            return (typeof window.viewApi !== "undefined");
        }

        // Zombie doesn't set referers itself when requesting assets on a page
        // For this reason, there is a workaround in lib/bundle_views
        viewBrowser = new Browser();
        viewBrowser
            .visit(VIEW_URL)
            .then(function() {
                viewBrowser.wait(viewApiLoaded, function () {
                    viewApi = viewBrowser.window.viewApi;
                    viewDone = true;
                    checkDone();
                });
            });
    });
});

describe("socket api", function() {
    it("facilitates client -> server messaging with acknowledgements", function(done) {
        extensionApi.listenFor('clientToServer', function (data, cb) {
            cb();
        });
        dashboardApi.sendMessage('clientToServer', function () {
            done();
        });
    });

    it("facilitates server -> client messaging", function(done) {
        dashboardApi.listenFor('serverToClient', function () {
            done();
        });
        extensionApi.sendMessage('serverToClient');
    });

    it("doesn't let multiple declarations of a synced variable overwrite itself", function(done) {
        extensionApi.declareSyncedVar({ variableName: 'testVar', initialVal: 123 });
        dashboardApi.declareSyncedVar({ variableName: 'testVar', initialVal: 456,
            setter: function(newVal) {
                assert.equal(newVal, 123);
                assert.equal(extensionApi.variables.testVar, 123);
                assert.equal(dashboardApi.variables.testVar, 123);
                done();
            }
        });
    });
});

describe("extension api", function() {
    describe("nodecg config", function() {
        it("exists and has length", function() {
            assert.ok(Object.keys(extensionApi.config).length);
        });

        it("doesn't reveal sensitive information", function() {
            assert.equal(typeof(extensionApi.config.login.sessionSecret), 'undefined');
        });

        it("isn't writable", function() {
            extensionApi.config.host = 'the_test_failed';
            assert.notEqual(extensionApi.config.host, 'the_test_failed');
        });
    });

    describe("bundle config", function() {
        it("exists and has length", function() {
            assert.ok(Object.keys(extensionApi.bundleConfig).length);
        });
    })
});

describe("dashboard api", function() {
    describe("nodecg config", function() {
        it("exists and has length", function() {
            assert.ok(Object.keys(dashboardApi.config).length);
        });

        it("doesn't reveal sensitive information", function() {
            assert.equal(typeof(dashboardApi.config.login.sessionSecret), 'undefined');
        });

        it("isn't writable", function() {
            extensionApi.config.host = 'the_test_failed';
            assert.notEqual(dashboardApi.config.host, 'the_test_failed');
        });
    });

    describe("bundle config", function() {
        it("exists and has length", function() {
            assert.ok(Object.keys(dashboardApi.bundleConfig).length);
        });
    })
});

describe("view api", function() {
    describe("nodecg config", function() {
        it("exists and has length", function() {
            assert.ok(Object.keys(viewApi.config).length);
        });

        it("doesn't reveal sensitive information", function() {
            assert.equal(typeof(viewApi.config.login.sessionSecret), 'undefined');
        });

        it("isn't writable", function() {
            extensionApi.config.host = 'the_test_failed';
            assert.notEqual(viewApi.config.host, 'the_test_failed');
        });
    });

    describe("bundle config", function() {
        it("exists and has length", function() {
            assert.ok(Object.keys(viewApi.bundleConfig).length);
        });
    })
});

describe("dashboard", function() {
    it("renders panel Jade with bundleConfig", function() {
        dashboardBrowser.assert.text('#test-bundle .js-test', 'the_test_string');
    });
});

after(function() {
    server.shutdown();
});
