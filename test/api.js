// Modules used to run tests
var assert = require('assert');
var Browser = require('zombie');

// Start up the server
var server = require(process.cwd() + '/server.js');

// Modules needed to set up test environment
var util = require('util');
var config = require(process.cwd() + '/lib/config').config;
var filteredConfig = require(process.cwd() + '/lib/config').filteredConfig;
var ExtensionApi = require(process.cwd() + '/lib/extension_api');

var BUNDLE_NAME = 'test-bundle';
var DASHBOARD_URL = util.format("http://%s:%d/", config.host, config.port);

describe("api", function() {
    var serverApi = {};
    before(function() {
        serverApi = new ExtensionApi(BUNDLE_NAME, server.io);
    });

    var clientApi = {};
    before(function(done) {
        var self = this;

        // Wait until page is loaded
        function pageLoaded(window) {
            return (typeof window.NodeCG !== "undefined");
        }

        this.timeout(15000);
        this.browser = new Browser();
        this.browser
            .visit(DASHBOARD_URL)
            .then(function() {
                self.browser.wait(pageLoaded, function () {
                    var evalStr = util.format('window.clientApi = new NodeCG("%s", %s)', BUNDLE_NAME, JSON.stringify(filteredConfig));
                    clientApi = self.browser.evaluate(evalStr);

                    self.browser.wait(function(w) {
                        var socket = w.clientApi._socket;
                        //if (socket.connected === false) return false;
                        //if (socket.io.engine.readyState !== 'open') return false;
                        if (socket.io.engine.upgrading || socket.io.engine.upgrade) return false;
                        return true;
                    }, done);
                });
            });
    });

    it("should allow client -> server messaging with callbacks", function(done) {
        serverApi.listenFor('clientToServer', function (data, cb) {
            cb();
        });
        clientApi.sendMessage('clientToServer', function () {
            done();
        });
    });

    it("should allow server -> client messaging without callbacks", function(done) {
        clientApi.listenFor('serverToClient', function () {
            done();
        });
        serverApi.sendMessage('serverToClient');
    });

    it("should not let multiple declarations of synced variables overwrite one another", function(done) {
        serverApi.declareSyncedVar({ variableName: 'testVar', initialVal: 123 });
        clientApi.declareSyncedVar({ variableName: 'testVar', initialVal: 789,
            setter: function(newVal) {
                assert.equal(serverApi.variables.testVar, 123);
                assert.equal(clientApi.variables.testVar, 123);
                done();
            }});
    });

    describe("server api config property", function() {
        it("should exist and have length", function() {
            assert.ok(Object.keys(serverApi.config).length);
        });

        it("should not reveal sensitive information", function() {
            assert.equal(typeof(serverApi.config.login.sessionSecret), 'undefined');
        });

        it("should not be writable", function() {
            serverApi.config.host = 'the_test_failed';
            assert.notEqual(serverApi.config.host, 'the_test_failed');
        });
    });

    describe("client api config property", function() {
        it("should exist and have length", function() {
            assert.ok(Object.keys(clientApi.config).length);
        });

        it("should not reveal sensitive information", function() {
            assert.equal(typeof(clientApi.config.login.sessionSecret), 'undefined');
        });

        it("should not be writable", function() {
            serverApi.config.host = 'the_test_failed';
            assert.notEqual(clientApi.config.host, 'the_test_failed');
        });
    });

    after(function() {
        server.shutdown();
    });
});
