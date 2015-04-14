'use strict';

// Modules used to run tests
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var fs = require('fs');

var e = require('./setup/test-environment');

describe('client api', function() {
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
            e.apis.extension.Replicant('clientTest', { defaultValue: 'foo', persistent: false });
            var rep = e.apis.dashboard.Replicant('clientTest', { defaultValue: 'bar' });

            // Give Zombie a chance to process socket.io events
            e.browsers.dashboard.wait({duration: 10}, function() {});

            setTimeout(function() {
                expect(rep.value).to.equal('foo');
                done();
            }, 50);
        });

        it('can be read once without subscription, via readReplicant', function(done) {
            e.apis.dashboard.readReplicant('clientTest', function(replicant) {
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
            var rep = e.apis.dashboard.Replicant('clientAssignmentTest', { persistent: false });
            rep.on('assignmentAccepted', function(data) {
                expect(data.value).to.equal('assignmentOK');
                expect(data.revision).to.equal(1);
                done();
            });
            rep.value = 'assignmentOK';

            // Give Zombie a chance to process socket.io events.
            // I don't know why I have to micromanage the event loop like this.
            // This is dumb.
            // I am mad.
            e.browsers.dashboard.wait({duration: 10}, function() {
                e.browsers.dashboard.wait({duration: 10}, function() {});
            });
        });

        // Skipping this test for now because for some reason changes to the value object
        // aren't triggering the Nested.observe callback.
        it.skip('reacts to changes in nested properties of objects', function(done) {
            var rep = e.apis.dashboard.Replicant('clientObjTest', {
                persistent: false,
                defaultValue: {
                    a: {
                        b: {
                            c: 'c'
                        }
                    }
                }
            });

            rep.on('change', function(oldVal, newVal, changes) {
                expect(oldVal).to.deep.equal({a: {b: {c: 'c'}}});
                expect(newVal).to.deep.equal({a: {b: {c: 'nestedChangeOK'}}});
                expect(changes).to.have.length(1);
                expect(changes[0].type).to.equal('update');
                expect(changes[0].path).to.equal('a.b.c');
                expect(changes[0].oldValue).to.equal('c');
                expect(changes[0].newValue).to.equal('nestedChangeOK');
                done();
            });

            // This is FUCKING stupid.
            e.browsers.dashboard.wait({duration: 10}, function() {
                rep.value.a.b.c = 'nestedChangeOK';

                e.browsers.dashboard.wait({duration: 10}, function() {
                    e.browsers.dashboard.wait({duration: 10}, function() {});
                });
            });
        });

        it('load persisted values when they exist', function(done) {
            // Make sure the persisted value exists
            fs.writeFileSync('./db/replicants/test-bundle.clientPersistence', 'it work good!');

            var rep = e.apis.dashboard.Replicant('clientPersistence');
            e.browsers.dashboard.wait({duration: 10}, function() {
                expect(rep.value).to.equal('it work good!');
                done();
            });
        });

        it('persist assignment to disk', function(done) {
            var rep = e.apis.dashboard.Replicant('clientPersistence');
            rep.value = { nested: 'hey we assigned!' };
            e.browsers.dashboard.wait({duration: 10}, function() {
                var persistedValue = fs.readFileSync('./db/replicants/test-bundle.clientPersistence', 'utf-8');
                expect(persistedValue).to.equal('{"nested":"hey we assigned!"}');
                done();
            });
        });

        // Skipping this test for now because for some reason changes to the value object
        // aren't triggering the Nested.observe callback.
        it.skip('persist changes to disk', function(done) {
            var rep = e.apis.dashboard.Replicant('clientPersistence');
            rep.value.nested = 'hey we changed!';
            e.browsers.dashboard.wait({duration: 10}, function() {
                var persistedValue = fs.readFileSync('./db/replicants/test-bundle.clientPersistence', 'utf-8');
                expect(persistedValue).to.equal('{"nested":"hey we changed!"}');
                done();
            });
        });

        it('don\'t persist when "persistent" is set to "false"', function(done) {
            // Remove the file if it exists for some reason
            try {
                fs.unlinkSync('./db/replicants/test-bundle.clientTransience');
            } catch(e) {}

            e.apis.dashboard.Replicant('clientTransience', { defaultValue: 'o no', persistent: false });
            e.browsers.dashboard.wait({duration: 10}, function() {
                var exists = fs.existsSync('./db/replicants/test-bundle.clientTransience');
                expect(exists).to.be.false;
                done();
            });
        });

        it.skip('redeclare after reconnecting to Socket.IO', function(done) {
            this.timeout(30000);
            var rep = e.apis.dashboard.Replicant('clientRedeclare', { defaultValue: 'foo', persistent: false });
            e.browsers.dashboard.wait({duration: 10}, function() {});
            rep.once('declared', function() {
                e.server.once('stopped', function() {
                    rep.once('declared', done);
                    e.server.once('started', function() {});
                    e.server.start();
                });
                e.server.stop();
            });
        });
    });
});
