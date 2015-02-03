'use strict';

// Modules used to run tests
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var Browser = require('zombie');

var C = require('./setup/test-constants');
var e = require('./setup/test-environment');

var dashboardBrowser = null;
var viewBrowser = null;
var extensionApi = null;
var dashboardApi = null;
var viewApi = null;
var apiOutlets = {
    view: null,
    dashboard: null,
    extension: null
};

describe("nodecg api", function() {
    before(function(done) {
        this.timeout(10000);

        var dashboardDone = false;
        var viewDone = false;
        function checkDone() {
            if (dashboardDone && viewDone) done();
        }

        /** Extension API setup **/
        extensionApi = e.server.getExtensions()[C.BUNDLE_NAME];

        /** Dashboard API setup **/
        // Wait until dashboard API is loaded
        function dashboardApiLoaded(window) {
            return (typeof window.dashboardApi !== "undefined");
        }

        dashboardBrowser = new Browser();
        dashboardBrowser
            .visit(C.DASHBOARD_URL)
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
            return (typeof window.viewApi !== "undefined");
        }

        // Zombie doesn't set referers itself when requesting assets on a page
        // For this reason, there is a workaround in lib/bundle_views
        viewBrowser = new Browser();
        viewBrowser
            .visit(C.VIEW_URL)
            .then(function() {
                viewBrowser.wait(viewApiLoaded, function () {
                    viewApi = viewBrowser.window.viewApi;
                    viewDone = true;
                    checkDone();
                });
            });

        /** Setup for tests that run on all APIs **/
        apiOutlets.view = viewApi;
        apiOutlets.dashboard = dashboardApi;
        apiOutlets.extension = extensionApi;
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
            extensionApi.declareSyncedVar({ name: 'testVar', initialVal: 123 });

            // Give Zombie a chance to process socket.io events
            dashboardBrowser.wait({duration: 100}, function() {
                dashboardApi.declareSyncedVar({ name: 'testVar', initialVal: 456,
                    setter: function(newVal) {
                        newVal.should.equal(123);
                        extensionApi.variables.testVar.should.equal(123);
                        dashboardApi.variables.testVar.should.equal(123);
                        done();
                    }
                });
            });
        });
    });

    // Some tests are the same for the view, dashboard, and extensions, but they still need to be tested individually.
    // This is a silly hack to avoid having to copy/paste tests.
    for (var outlet in apiOutlets) {
        if (!apiOutlets.hasOwnProperty(outlet)) continue;

        describe(outlet + ' api', function() {
            var api;
            before(function() {
                api = apiOutlets[outlet];
            });

            describe('nodecg config', function() {
                it('exists and has length', function() {
                    console.log(api);
                    expect(api.config).to.not.be.empty();
                });

                it('doesn\'t reveal sensitive information', function() {
                    expect(api.config.login).to.not.have.property('sessionSecret');
                });

                it('isn\'t writable', function() {
                    expect(function() {
                        api.config.host = 'the_test_failed';
                    }).to.throw(TypeError);
                });
            });

            describe('bundle config', function() {
                it('exists and has length', function() {
                    expect(api.bundleConfig).to.not.be.empty();
                });
            });

            describe('synced variables', function() {
                it('readSyncedVar works', function() {
                    var val = api.readSyncedVar('testVar');
                    expect(val).to.equal(123);
                });

                it('supports legacy "variableName" when declaring synced variables', function() {
                    api.declareSyncedVar({ variableName: 'oldVar', initialVal: 123 });
                    api.variables.oldVar.should.equal(123);
                });

                it('supports "initialVal" and "initialValue" when declaring synced variables', function() {
                    api.declareSyncedVar({ variableName: 'initialVal', initialVal: 123 });
                    api.declareSyncedVar({ variableName: 'initialValue', initialValue: 456 });

                    api.variables.initialVal.should.equal(123);
                    api.variables.initialValue.should.equal(456);
                });

                it('throws an error when no name is given to a synced variable', function () {
                    expect(function() {
                        api.declareSyncedVar({ initialValue: 123 });
                    }).to.throw(Error);
                });
            });
        });
    }
});
