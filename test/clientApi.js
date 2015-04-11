'use strict';

// Modules used to run tests
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

var e = require('./setup/test-environment');

describe('client api', function() {
    before(function(done) {
        // Drop all synced variables
        e.server._resetReplicants();

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

    describe('replicants', function() {
        it('only apply defaultValue when first declared', function(done) {
            e.apis.extension.Replicant('test', { defaultValue: 'foo' });
            var rep = e.apis.dashboard.Replicant('test', { defaultValue: 'bar' });

            // Give Zombie a chance to process socket.io events
            e.browsers.dashboard.wait({duration: 100}, function() {
                expect(rep.value).to.equal('foo');
                done();
            });
        });

        it('can be read once without subscription, via readReplicant', function(done) {
            e.apis.dashboard.readReplicant('test', function(replicant) {
                expect(replicant.value).to.equal('foo');
                done();
            });
        });

        it('throws an error when no name is given to a synced variable', function () {
            expect(function() {
                e.apis.dashboard.Replicant();
            }).to.throw(/Must supply a name when instantiating a Replicant/);
        });

        it('can be assigned via the ".value" property', function (done) {
            var rep = e.apis.dashboard.Replicant('assignmentTest');

            // Give Zombie a chance to process socket.io events
            e.browsers.dashboard.wait({duration: 100}, function() {
                rep.value = 'assignmentOK';

                // Give Zombie a chance to process socket.io events
                e.browsers.dashboard.wait({duration: 100}, function() {
                    e.apis.dashboard.readReplicant('assignmentTest', function(replicant) {
                        expect(replicant.value).to.equal('assignmentOK');
                        done();
                    });
                });
            });
        });

        it.skip('reacts to changes in nested properties of objects', function(done) {
            var rep = e.apis.dashboard.Replicant('objTest', {
                defaultValue: {
                    a: {
                        b: {
                            c: 'c'
                        }
                    }
                }
            });

            // Give Zombie a chance to process socket.io events
            e.browsers.dashboard.wait({duration: 100}, function() {
                rep.value.a.b.c = 'nestedChangeOK';

                e.browsers.dashboard.wait({duration: 100}, function() {
                    e.apis.dashboard.readReplicant('objTest', function(replicant) {
                        expect(replicant.value.a.b.c).to.equal('nestedChangeOK');
                        done();
                    });
                });
            });
        });
    });
});
