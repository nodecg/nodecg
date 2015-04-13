'use strict';

// Modules used to run tests
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var request = require('request');

var e = require('./setup/test-environment');
var C = require('./setup/test-constants');

describe('extension api', function() {
    it('can receive messages and fire acknowledgements', function(done) {
        e.apis.extension.listenFor('clientToServer', function (data, cb) {
            cb();
        });
        e.apis.dashboard.sendMessage('clientToServer', done);

        // Give Zombie a chance to process socket.io events
        // What the actual fuck why is this only SOMETIMES necessary??????
        // I'm so mad what the heck
        e.browsers.dashboard.wait({duration: 100});
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

    describe('replicants', function() {
        it('only apply defaultValue when first declared', function(done) {
            e.apis.dashboard.Replicant('extensionTest', { defaultValue: 'foo', persistent: false });

            // Give Zombie a chance to process socket.io events
            e.browsers.dashboard.wait({duration: 10}, function() {
                var rep = e.apis.extension.Replicant('extensionTest', { defaultValue: 'bar' });
                expect(rep.value).to.equal('foo');
                done();
            });
        });

        it('can be read once without subscription, via readReplicant', function() {
             expect(e.apis.extension.readReplicant('extensionTest').value).to.equal('foo');
        });

        it('throws an error when no name is given to a synced variable', function () {
            expect(function() {
                e.apis.extension.Replicant();
            }).to.throw(/Must supply a name when instantiating a Replicant/);
        });

        it('can be assigned via the ".value" property', function () {
            var rep = e.apis.extension.Replicant('extensionAssignmentTest', { persistent: false });
            rep.value = 'assignmentOK';
            expect(rep.value).to.equal('assignmentOK');
        });

        it('reacts to changes in nested properties of objects', function(done) {
            var rep = e.apis.extension.Replicant('extensionObjTest', {
                persistent: false,
                defaultValue: {
                    a: {
                        b: {
                            c: 'c'
                        }
                    }
                }
            });

            rep.value.a.b.c = 'nestedChangeOK';

            rep.on('change', function(oldVal, newVal, change) {
                expect(change.type).to.equal('update');
                expect(change.path).to.equal('a.b.c');
                expect(change.oldValue).to.equal('c');
                expect(change.newValue).to.equal('nestedChangeOK');
                done();
            });
        });
    });

});
