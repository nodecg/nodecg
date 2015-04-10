'use strict';

// Modules used to run tests
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var request = require('request');

var e = require('./setup/test-environment');
var C = require('./setup/test-constants');

describe('extension api', function() {
    before(function(done) {
        // Drop all synced variables
        e.server._resetSyncedVariables();

        // Wait a bit for all clients to react
        setTimeout(done, 1750);
    });

    it('can receive messages and fire acknowledgements', function(done) {
        e.apis.extension.listenFor('clientToServer', function (data, cb) {
            cb();
        });
        e.apis.dashboard.sendMessage('clientToServer', done);
    });

    it('can send messages', function(done) {
        e.apis.dashboard.listenFor('serverToClient', done);
        e.apis.extension.sendMessage('serverToClient');
    });

    it('can mount express middleware', function(done) {
        request(C.DASHBOARD_URL + 'test-bundle/test-route', function (error, response, body) {
            expect(error).to.be.null();
            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    describe('nodecg config', function() {
        it('exists and has length', function() {
            expect(e.apis.extension.config).to.not.be.empty();
        });

        it('doesn\'t reveal sensitive information', function() {
            expect(e.apis.extension.config.login).to.not.have.property('sessionSecret');
        });

        it('isn\'t writable', function() {
            expect(function() {
                e.apis.extension.config.host = 'the_test_failed';
            }).to.throw(TypeError);
        });
    });

    describe('bundle config', function() {
        it('exists and has length', function() {
            expect(e.apis.extension.bundleConfig).to.not.be.empty();
        });
    });

    describe('synced variables', function() {
        it('doesn\'t let multiple declarations of a synced variable overwrite itself', function(done) {
            e.apis.extension.declareSyncedVar({ name: 'testVar', initialVal: 123 });

            // Give Zombie a chance to process socket.io events
            e.browsers.dashboard.wait({duration: 100}, function() {
                e.apis.dashboard.declareSyncedVar({ name: 'testVar', initialVal: 456,
                    setter: function(newVal) {
                        newVal.should.equal(123);
                        e.apis.extension.variables.testVar.should.equal(123);
                        done();
                    }
                });
            });
        });

        it('supports single retrieval via readSyncedVar', function() {
            var val = e.apis.extension.readSyncedVar('testVar');
            expect(val).to.equal(123);
        });

        it('supports legacy "variableName" when declaring synced variables', function() {
            e.apis.extension.declareSyncedVar({ variableName: 'oldVar', initialVal: 123 });
            expect(e.apis.extension.variables.oldVar).to.equal(123);
        });

        it('supports "initialVal" and "initialValue" when declaring synced variables', function() {
            e.apis.extension.declareSyncedVar({ variableName: 'initialVal', initialVal: 123 });
            e.apis.extension.declareSyncedVar({ variableName: 'initialValue', initialVal: 456 });

            expect(e.apis.extension.variables.initialVal).to.equal(123);
            expect(e.apis.extension.variables.initialValue).to.equal(456);
        });

        it('throws an error when no name is given to a synced variable', function () {
            expect(function() {
                e.apis.extension.declareSyncedVar({ initialValue: 123 });
            }).to.throw(Error);
        });
    });

});
