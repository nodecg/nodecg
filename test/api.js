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

describe("nodecg api", function() {
    before(function(done) {
        this.timeout(15000);

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
            dashboardApi.declareSyncedVar({ name: 'testVar', initialVal: 456,
                setter: function(newVal) {
                    newVal.should.equal(123);
                    extensionApi.variables.testVar.should.equal(123);
                    dashboardApi.variables.testVar.should.equal(123);
                    done();
                }
            });
        });

        it("supports legacy 'variableName' when declaring synced variables", function() {
            extensionApi.declareSyncedVar({ variableName: 'oldVar', initialVal: 123 });

            extensionApi.variables.oldVar.should.equal(123);
        });

        it("supports 'initialVal' and 'initialValue' when declaring synced variables", function() {
            extensionApi.declareSyncedVar({ variableName: 'initialVal', initialVal: 123 });
            extensionApi.declareSyncedVar({ variableName: 'initialValue', initialValue: 456 });

            extensionApi.variables.initialVal.should.equal(123);
            extensionApi.variables.initialValue.should.equal(456);
        });

        it("throws an error when no name is given to a synced variable", function () {
            expect(function() {
                extensionApi.declareSyncedVar({ initialValue: 123 });
            }).to.throw(Error);
        });
    });

    describe("extension api", function() {
        describe("nodecg config", function() {
            it("exists and has length", function() {
                expect(extensionApi.config).to.not.be.empty;
            });

            it("doesn't reveal sensitive information", function() {
                expect(extensionApi.config.login).to.not.have.property('sessionSecret');
            });

            it("isn't writable", function() {
                expect(function() {
                    extensionApi.config.host = 'the_test_failed';
                }).to.throw(TypeError);
            });
        });

        describe("bundle config", function() {
            it("exists and has length", function() {
                expect(extensionApi.bundleConfig).to.not.be.empty();
            });
        });
    });

    describe("dashboard api", function() {
        describe("nodecg config", function() {
            it("exists and has length", function() {
                expect(dashboardApi.config).to.not.be.empty;
            });

            it("doesn't reveal sensitive information", function() {
                expect(dashboardApi.config.login).to.not.have.property('sessionSecret');
            });

            it("isn't writable", function() {
                expect(function() {
                    dashboardApi.config.host = 'the_test_failed';
                }).to.throw(TypeError);
            });
        });

        describe("bundle config", function() {
            it("exists and has length", function() {
                expect(dashboardApi.bundleConfig).to.not.be.empty();
            });
        });
    });

    describe("view api", function() {
        describe("nodecg config", function() {
            it("exists and has length", function() {
                expect(viewApi.config).to.not.be.empty;
            });

            it("doesn't reveal sensitive information", function() {
                expect(viewApi.config.login).to.not.have.property('sessionSecret');
            });

            it("isn't writable", function() {
                expect(function() {
                    viewApi.config.host = 'the_test_failed';
                }).to.throw(TypeError);
            });
        });

        describe("bundle config", function() {
            it("exists and has length", function() {
                expect(viewApi.bundleConfig).to.not.be.empty();
            });
        });
    });
});
