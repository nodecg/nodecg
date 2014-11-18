// Modules used to run tests
var assert = require('assert');
var Browser = require("zombie");

// Start up the server
var server = require(process.cwd() + '/server.js');

var BUNDLE_NAME = 'test-bundle';

describe("api", function() {
    var serverApi = {};
    before(function(done) {
        this.timeout(10000);
        server.emitter.on('extensionsLoaded', function(){
            serverApi = server.extensions[BUNDLE_NAME];
            done();
        });
    });

    var clientApi = {};
    before(function(done) {
        var self = this;
        this.browser = new Browser();
        this.browser
            .visit("http://localhost:9090/")
            .then(function() {
                clientApi = self.browser.window.testBundleApiInstance;
            })
            .then(done, done);
    });

    it("should not let multiple declarations of synced variables overwrite one another", function(done) {
        serverApi.declareSyncedVar({ variableName: 'testVar', initialVal: 123 });
        clientApi.declareSyncedVar({ variableName: 'testVar', initialVal: 456,
            setter: function(newVal) {
                assert.equal(serverApi.variables.testVar, 123);
                assert.equal(clientApi.variables.testVar, 123);
                done();
            }
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
    })
});


