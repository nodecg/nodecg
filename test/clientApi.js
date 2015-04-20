'use strict';

// Modules used to run tests
var chai = require('chai');
var expect = chai.expect;
var fs = require('fs');

var e = require('./setup/test-environment');

describe('client api', function() {
    describe('dashboard api', function() {
        // Check for basic connectivity. The rest of the test are run from the dashboard as well.
        it('can receive messages', function(done) {
            e.browsers.dashboard.executeAsync(function(done) {
                window.dashboardApi.listenFor('serverToDashboard', done);
            }, function() {
                done();
            });
            e.apis.extension.sendMessage('serverToDashboard');
        });

        it('can send messages', function(done) {
            e.apis.extension.listenFor('dashboardToServer', done);
            e.browsers.dashboard.execute(function() {
                window.dashboardApi.sendMessage('dashboardToServer');
            });
        });
    });

    describe('view api', function() {
        // The view and dashboard APIs use the same file
        // If dashboard API passes all its tests, we just need to make sure that the socket works
        it('can receive messages', function(done) {
            e.browsers.view.executeAsync(function(done) {
                window.viewApi.listenFor('serverToView', done);
            }, function() {
                done();
            });
            e.apis.extension.sendMessage('serverToView');
        });

        it('can send messages', function(done) {
            e.apis.extension.listenFor('viewToServer', done);
            e.browsers.view.execute(function() {
                window.viewApi.sendMessage('viewToServer');
            });
        });
    });

    describe('nodecg config', function() {
        it('exists and has length', function(done) {
            e.browsers.dashboard
                .execute(function() {
                    return window.dashboardApi.config;
                }, function(err, config) {
                    expect(config).to.not.be.empty();
                })
                .call(done);
        });

        it('doesn\'t reveal sensitive information', function(done) {
            e.browsers.dashboard
                .execute(function() {
                    return window.dashboardApi.config;
                }, function(err, config) {
                    expect(config.login).to.not.have.property('sessionSecret');
                })
                .call(done);
        });

        it('isn\'t writable', function(done) {
            e.browsers.dashboard
                .executeAsync(function(done) {
                    try {
                        window.dashboardApi.config.host = 'the_test_failed';
                    }
                    catch (e) {
                        done(e instanceof TypeError);
                    }
                }, function(err, isTypeError) {
                    expect(isTypeError).to.be.true;
                    done();
                });
        });
    });

    describe('bundle config', function() {
        it('exists and has length', function(done) {
            e.browsers.dashboard
                .execute(function() {
                    return window.dashboardApi.bundleConfig;
                }, function(err, bundleConfig) {
                    expect(bundleConfig).to.not.be.empty();
                })
                .call(done);
        });
    });

    describe('replicants', function() {
        it('only apply defaultValue when first declared', function(done) {
            e.apis.extension.Replicant('clientTest', { defaultValue: 'foo', persistent: false });
            e.browsers.dashboard
                .executeAsync(function(done) {
                    var rep = window.dashboardApi.Replicant('clientTest', { defaultValue: 'bar' });

                    rep.on('declared', function() {
                        done(rep.value);
                    });
                }, function(err, replicantValue) {
                    expect(replicantValue).to.equal('foo');
                    done();
                });
        });

        it('can be read once without subscription, via readReplicant', function(done) {
            e.browsers.dashboard
                .executeAsync(function(done) {
                    window.dashboardApi.readReplicant('clientTest', function(value) {
                        done(value);
                    });
                }, function(err, replicantValue) {
                    expect(replicantValue).to.equal('foo');
                    done();
                });
        });

        it('throws an error when no name is given to a synced variable', function(done) {
            e.browsers.dashboard
                .executeAsync(function(done) {
                    try {
                        window.dashboardApi.Replicant();
                    }
                    catch (e) {
                        done(e.message);
                    }
                }, function(err, errorMessage) {
                    expect(errorMessage).to.equal('Must supply a name when instantiating a Replicant');
                    done();
                });
        });

        it('can be assigned via the ".value" property', function (done) {
            e.browsers.dashboard
                .executeAsync(function(done) {
                    var rep = window.dashboardApi.Replicant('clientAssignmentTest', { persistent: false });
                    rep.on('assignmentAccepted', function(data) {
                        done(data);
                    });
                    rep.value = 'assignmentOK';
                }, function(err, data) {
                    expect(data.value).to.equal('assignmentOK');
                    expect(data.revision).to.equal(1);
                    done();
                });
        });

        // Skipping this test for now because for some reason changes to the value object
        // aren't triggering the Nested.observe callback.
        it.skip('reacts to changes in nested properties of objects', function(done) {
            e.browsers.dashboard
                .executeAsync(function(done) {
                    var rep = window.dashboardApi.Replicant('clientObjTest', {
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
                        done({
                            oldVal: oldVal,
                            newVal: newVal,
                            changes: changes
                        })
                    });
                }, function(err, data) {
                    expect(data.oldVal).to.deep.equal({a: {b: {c: 'c'}}});
                    expect(data.newVal).to.deep.equal({a: {b: {c: 'nestedChangeOK'}}});
                    expect(data.changes).to.have.length(1);
                    expect(data.changes[0].type).to.equal('update');
                    expect(data.changes[0].path).to.equal('a.b.c');
                    expect(data.changes[0].oldValue).to.equal('c');
                    expect(data.changes[0].newValue).to.equal('nestedChangeOK');
                    done();
                });
        });

        it('load persisted values when they exist', function(done) {
            // Make sure the persisted value exists
            fs.writeFileSync('./db/replicants/test-bundle.clientPersistence', 'it work good!');

            e.browsers.dashboard
                .executeAsync(function(done) {
                    var rep = window.dashboardApi.Replicant('clientPersistence');

                    rep.on('change', function() {
                        done(rep.value);
                    });
                }, function(err, replicantValue) {
                    expect(replicantValue).to.equal('it work good!');
                    done();
                });
        });

        it('persist assignment to disk', function(done) {
            e.browsers.dashboard
                .executeAsync(function(done) {
                    var rep = window.dashboardApi.Replicant('clientPersistence');
                    rep.value = { nested: 'hey we assigned!' };

                    rep.on('change', function() {
                        done();
                    });
                }, function(err) {
                    var persistedValue = fs.readFileSync('./db/replicants/test-bundle.clientPersistence', 'utf-8');
                    expect(persistedValue).to.equal('{"nested":"hey we assigned!"}');
                    done();
                });
        });

        // Skipping this test for now because for some reason changes to the value object
        // aren't triggering the Nested.observe callback.
        it.skip('persist changes to disk', function(done) {
            e.browsers.dashboard
                .executeAsync(function(done) {
                    var rep = window.dashboardApi.Replicant('clientPersistence');
                    rep.value.nested = 'hey we changed!';

                    rep.on('change', function() {
                        done();
                    });
                }, function(err) {
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

            e.browsers.dashboard
                .executeAsync(function(done) {
                    window.dashboardApi.Replicant('clientTransience', { defaultValue: 'o no', persistent: false });

                    rep.on('declared', function() {
                        done();
                    });
                }, function(err) {
                    var exists = fs.existsSync('./db/replicants/test-bundle.clientTransience');
                    expect(exists).to.be.false;
                    done();
                });
        });

        it.skip('redeclare after reconnecting to Socket.IO', function(done) {
            this.timeout(30000);
            var rep = window.dashboardApi.Replicant('clientRedeclare', { defaultValue: 'foo', persistent: false });
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
