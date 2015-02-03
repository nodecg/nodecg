'use strict';

// Modules used to run tests
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

var e = require('./setup/test-environment');

describe('client api', function() {
    before(function(done) {
        // Drop all synced variables
        e.server._resetSyncedVariables();

        // Wait a bit for all clients to react
        setTimeout(done, 1750);
    });

    describe('dashboard api', function() {
        // Check for basic connectivity. The rest of the test are run from the dashboard as well.
        it('can receive messages', function(done) {
            e.apis.dashboard.listenFor('dashboardToServer', done);
            e.apis.extension.sendMessage('dashboardToServer');
        });

        it('can send messages', function(done) {
            e.apis.extension.listenFor('serverToDashboard', done);
            e.apis.dashboard.sendMessage('serverToDashboard');
        });
    });

    describe('view api', function() {
        // The view and dashboard APIs use the same file
        // If dashboard API passes all its tests, we just need to make sure that the socket works
        it('can receive messages', function(done) {
            e.apis.view.listenFor('viewToServer', done);
            e.apis.extension.sendMessage('viewToServer');
        });

        it('can send messages', function(done) {
            e.apis.extension.listenFor('serverToView', done);
            e.apis.view.sendMessage('serverToView');
        });
    });

    describe('nodecg config', function() {
        it('exists and has length', function() {
            expect(e.apis.dashboard.config).to.not.be.empty();
        });

        it('doesn\'t reveal sensitive information', function() {
            expect(e.apis.dashboard.config.login).to.not.have.property('sessionSecret');
        });

        it('isn\'t writable', function() {
            expect(function() {
                e.apis.dashboard.config.host = 'the_test_failed';
            }).to.throw(TypeError);
        });
    });

    describe('bundle config', function() {
        it('exists and has length', function() {
            expect(e.apis.dashboard.bundleConfig).to.not.be.empty();
        });
    });

    describe('synced variables', function() {
        it('doesn\'t let multiple declarations of a synced variable overwrite itself', function(done) {
            e.apis.dashboard.declareSyncedVar({ name: 'testVar', initialVal: 123 });

            // Give Zombie a chance to process socket.io events
            e.browsers.dashboard.wait({duration: 100}, function() {
                e.apis.extension.declareSyncedVar({ name: 'testVar', initialVal: 456,
                    setter: function(newVal) {
                        newVal.should.equal(123);
                        e.apis.dashboard.variables.testVar.should.equal(123);
                        done();
                    }
                });
            });
        });

        it('supports single retrieval via readSyncedVar', function(done) {
            e.apis.dashboard.readSyncedVar('testVar', function(val) {
                expect(val).to.equal(123);
                done();
            });
        });

        it('supports legacy "variableName" when declaring synced variables', function(done) {
            e.apis.dashboard.declareSyncedVar({ variableName: 'oldVar', initialVal: 123 });

            // Give Zombie a chance to process socket.io events
            e.browsers.dashboard.wait({duration: 100}, function() {
                expect(e.apis.dashboard.variables.oldVar).to.equal(123);
                done();
            });
        });

        it('supports "initialVal" and "initialValue" when declaring synced variables', function(done) {
            e.apis.dashboard.declareSyncedVar({ variableName: 'initialVal', initialVal: 123 });
            e.apis.dashboard.declareSyncedVar({ variableName: 'initialValue', initialVal: 456 });

            e.browsers.dashboard.wait({duration: 100}, function() {
                expect(e.apis.dashboard.variables.initialVal).to.equal(123);
                expect(e.apis.dashboard.variables.initialValue).to.equal(456);
                done();
            });
        });

        it('throws an error when no name is given to a synced variable', function () {
            expect(function() {
                e.apis.dashboard.declareSyncedVar({ initialValue: 123 });
            }).to.throw(/Attempted to declare an unnamed variable/);
        });
    });
});
