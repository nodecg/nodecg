// Modules used to run tests
var assert = require('assert');
var Browser = require('zombie');

// Modules needed to set up test environment
var util = require('util');
var path = require('path');
var fs = require('fs');
var config = require(process.cwd() + '/lib/config').config;
var wrench = require('wrench');

var BUNDLE_NAME = 'test-bundle';
var DASHBOARD_URL = util.format("http://%s:%d/", config.host, config.port);
var BUNDLE_DIR = path.resolve(process.cwd(), 'bundles', BUNDLE_NAME);
var CFG_PATH = path.resolve(process.cwd(), 'cfg', BUNDLE_NAME + '.json');

var server = null;
var serverApi = null;
var clientApi = null;

before(function(done) {
    var self = this;
    this.timeout(10000);

    /** Set up test bundle **/
    wrench.copyDirSyncRecursive(__dirname + '/' + BUNDLE_NAME, BUNDLE_DIR, {
        forceDelete: true
    });
    fs.writeFileSync(CFG_PATH, JSON.stringify({ test: "data" }));

    // Start up the server
    server = require(process.cwd() + '/server.js');

    server.emitter.on('extensionsLoaded', function extensionsLoaded() {
        /** Server API setup **/
        serverApi = server.extensions[BUNDLE_NAME];

        /** Client API setup **/
        // Wait until page is loaded
        function pageLoaded(window) {
            return (typeof window.clientApi !== "undefined");
        }

        self.browser = new Browser();
        self.browser
            .visit(DASHBOARD_URL)
            .then(function() {
                self.browser.wait(pageLoaded, function () {
                    clientApi = self.browser.window.clientApi;
                    done();
                });
            });
    });
});

describe("socket api", function() {
    it("facilitates client -> server messaging with acknowledgements", function(done) {
        serverApi.listenFor('clientToServer', function (data, cb) {
            cb();
        });
        clientApi.sendMessage('clientToServer', function () {
            done();
        });
    });

    it("facilitates server -> client messaging", function(done) {
        clientApi.listenFor('serverToClient', function () {
            done();
        });
        serverApi.sendMessage('serverToClient');
    });

    it("doesn't let multiple declarations of a synced variable overwrite itself", function(done) {
        serverApi.declareSyncedVar({ variableName: 'testVar', initialVal: 123 });
        clientApi.declareSyncedVar({ variableName: 'testVar', initialVal: 456,
            setter: function(newVal) {
                assert.equal(newVal, 123);
                assert.equal(serverApi.variables.testVar, 123);
                assert.equal(clientApi.variables.testVar, 123);
                done();
            }
        });
    });
});

describe("server api", function() {
    describe("nodecg config", function() {
        it("exists and has length", function() {
            assert.ok(Object.keys(serverApi.config).length);
        });

        it("doesn't reveal sensitive information", function() {
            assert.equal(typeof(serverApi.config.login.sessionSecret), 'undefined');
        });

        it("isn't writable", function() {
            serverApi.config.host = 'the_test_failed';
            assert.notEqual(serverApi.config.host, 'the_test_failed');
        });
    });

    describe("bundle config", function() {
        it("exists and has length", function() {
            assert.ok(Object.keys(serverApi.bundleConfig).length);
        });
    })
});

describe("client api", function() {
    describe("nodecg config", function() {
        it("exists and has length", function() {
            assert.ok(Object.keys(clientApi.config).length);
        });

        it("doesn't reveal sensitive information", function() {
            assert.equal(typeof(clientApi.config.login.sessionSecret), 'undefined');
        });

        it("isn't writable", function() {
            serverApi.config.host = 'the_test_failed';
            assert.notEqual(clientApi.config.host, 'the_test_failed');
        });
    });

    describe("bundle config", function() {
        it("exists and has length", function() {
            assert.ok(Object.keys(clientApi.bundleConfig).length);
        });
    })
});

after(function() {
    server.shutdown();

    try {
        fs.unlinkSync(CFG_PATH);
        wrench.rmdirSyncRecursive(BUNDLE_DIR);
    } catch (e) {
        console.warn("Couldn't clean up test bundle files");
    }
});
