'use strict';

// Modules used to run tests
var chai = require('chai');
var expect = chai.expect;
var request = require('request');
var fs = require('fs');

var e = require('./setup/test-environment');
var C = require('./setup/test-constants');

describe('extension api', function() {
    it('can receive messages and fire acknowledgements', function(done) {
        e.apis.extension.listenFor('clientToServer', function() {
            done();
        });
        e.browsers.dashboard.execute(function() {
            window.dashboardApi.sendMessage('clientToServer');
        }, function(err) {
            if (err) {
                throw err;
            }
        });
    });

    it('can send messages', function(done) {
        e.browsers.dashboard.executeAsync(function(done) {
            window.dashboardApi.listenFor('serverToClient', done);
        }, function(err) {
            if (err) {
                throw err;
            }

            done();
        });
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
            e.browsers.dashboard
                .executeAsync(function(done) {
                    var rep = window.dashboardApi.Replicant('extensionTest', { defaultValue: 'foo', persistent: false });

                    rep.on('declared', function() {
                        done();
                    });
                }, function(err) {
                    if (err) {
                        throw err;
                    }

                    var rep = e.apis.extension.Replicant('extensionTest', { defaultValue: 'bar' });
                    expect(rep.value).to.equal('foo');
                    done();
                });
        });

        it('can be read once without subscription, via readReplicant', function() {
             expect(e.apis.extension.readReplicant('extensionTest')).to.equal('foo');
        });

        it('throw an error when no name is given to a synced variable', function () {
            expect(function() {
                e.apis.extension.Replicant();
            }).to.throw(/Must supply a name when instantiating a Replicant/);
        });

        it('can be assigned via the ".value" property', function () {
            var rep = e.apis.extension.Replicant('extensionAssignmentTest', { persistent: false });
            rep.value = 'assignmentOK';
            expect(rep.value).to.equal('assignmentOK');
        });

        it('react to changes in nested properties of objects', function(done) {
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
            rep.value.a.b.c = 'nestedChangeOK';
        });

        it('react to changes in arrays', function(done) {
            var rep = e.apis.extension.Replicant('extensionArrTest', {
                persistent: false,
                defaultValue: ['starting']
            });
            rep.on('change', function(oldVal, newVal, changes) {
                expect(oldVal).to.deep.equal(['starting']);
                expect(newVal).to.deep.equal(['starting', 'arrPushOK']);
                expect(changes).to.have.length(1);
                expect(changes[0].type).to.equal('splice');
                expect(changes[0].removed).to.deep.equal([]);
                expect(changes[0].removedCount).to.equal(0);
                expect(changes[0].added).to.deep.equal(['arrPushOK']);
                expect(changes[0].addedCount).to.equal(1);
                done();
            });
            rep.value.push('arrPushOK');
        });

        it('load persisted values when they exist', function() {
            // Make sure the persisted value exists
            fs.writeFileSync('./db/replicants/test-bundle.extensionPersistence', 'it work good!');

            var rep = e.apis.extension.Replicant('extensionPersistence');
            expect(rep.value).to.equal('it work good!');
        });

        it('persist assignment to disk', function(done) {
            var rep = e.apis.extension.Replicant('extensionPersistence');
            rep.value = { nested: 'hey we assigned!' };
            setTimeout(function() {
                var persistedValue = fs.readFileSync('./db/replicants/test-bundle.extensionPersistence', 'utf-8');
                expect(persistedValue).to.equal('{"nested":"hey we assigned!"}');
                done();
            }, 10);
        });

        it('persist changes to disk', function(done) {
            var rep = e.apis.extension.Replicant('extensionPersistence');
            rep.value.nested = 'hey we changed!';
            setTimeout(function() {
                var persistedValue = fs.readFileSync('./db/replicants/test-bundle.extensionPersistence', 'utf-8');
                expect(persistedValue).to.equal('{"nested":"hey we changed!"}');
                done();
            }, 10);
        });

        it('don\'t persist when "persistent" is set to "false"', function() {
            // Remove the file if it exists for some reason
            try {
                fs.unlinkSync('./db/replicants/test-bundle.extensionTransience');
            } catch(e) {}

            var rep = e.apis.extension.Replicant('extensionTransience', { persistent: false });
            rep.value = 'o no';
            var exists = fs.existsSync('./db/replicants/test-bundle.extensionTransience');
            expect(exists).to.be.false;
        });

        it('gets a fullUpdate when there is a revision mismatch', function(done) {
            var rep = e.apis.extension.Replicant('extensionRevision', {
                defaultValue: {
                    foo: 'bar'
                },
                persistent: false });
            rep.on('fullUpdate', function() {
                done();
            });
            rep.revision = -10;
            rep.value.foo = 'baz';
        });
    });

});
