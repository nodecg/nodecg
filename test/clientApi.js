'use strict';

// Modules used to run tests
var chai = require('chai');
var expect = chai.expect;
var fs = require('fs');

var e = require('./setup/test-environment');

describe('client api', function() {
    this.timeout(10000);

    describe('dashboard api', function() {
        // Check for basic connectivity. The rest of the test are run from the dashboard as well.
        it('can receive messages', function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .execute(function() {
                    window.serverToDashboardReceived = false;

                    window.dashboardApi.listenFor('serverToDashboard', function() {
                        window.serverToDashboardReceived = true;
                    });
                }, function(err) {
                    if (err) {
                        throw err;
                    }
                });

            var sendMessage = setInterval(function() {
                e.apis.extension.sendMessage('serverToDashboard');
            }, 500);

            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .executeAsync(function(done) {
                    var checkMessageReceived;

                    checkMessageReceived = setInterval(function() {
                        if (window.serverToDashboardReceived) {
                            clearInterval(checkMessageReceived);
                            done();
                        }
                    }, 50);
                }, function() {
                    clearInterval(sendMessage);
                })
                .call(done);
        });

        it('can send messages', function(done) {
            e.apis.extension.listenFor('dashboardToServer', done);

            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .execute(function() {
                    window.dashboardApi.sendMessage('dashboardToServer');
                }, function(err) {
                    if (err) {
                        throw err;
                    }
                });
        });
    });

    describe('view api', function() {
        // The view and dashboard APIs use the same file
        // If dashboard API passes all its tests, we just need to make sure that the socket works
        it('can receive messages', function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.view)
                .execute(function() {
                    window.serverToViewReceived = false;

                    window.viewApi.listenFor('serverToView', function() {
                        window.serverToViewReceived = true;
                    });
                }, function(err) {
                    if (err) {
                        throw err;
                    }
                });

            var sendMessage = setInterval(function() {
                e.apis.extension.sendMessage('serverToView');
            }, 500);

            e.browser.client
                .switchTab(e.browser.tabs.view)
                .executeAsync(function(done) {
                    var checkMessageReceived;

                    checkMessageReceived = setInterval(function() {
                        if (window.serverToViewReceived) {
                            clearInterval(checkMessageReceived);
                            done();
                        }
                    }, 50);
                }, function() {
                    clearInterval(sendMessage);
                })
                .call(done);
        });

        it('can send messages', function(done) {
            e.apis.extension.listenFor('viewToServer', done);

            e.browser.client
                .switchTab(e.browser.tabs.view)
                .execute(function() {
                    window.viewApi.sendMessage('viewToServer');
                }, function(err) {
                    if (err) {
                        throw err;
                    }
                });
        });
    });

    describe('nodecg config', function() {
        it('exists and has length', function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .execute(function() {
                    return window.dashboardApi.config;
                }, function(err, ret) {
                    if (err) {
                        throw err;
                    }

                    expect(ret.value).to.not.be.empty();
                })
                .call(done);
        });

        it('doesn\'t reveal sensitive information', function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .execute(function() {
                    return window.dashboardApi.config;
                }, function(err, ret) {
                    if (err) {
                        throw err;
                    }

                    expect(ret.value.login).to.not.have.property('sessionSecret');
                })
                .call(done);
        });

        it('isn\'t writable', function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .execute(function() {
                    return Object.isFrozen(window.dashboardApi.config);
                }, function(err, ret) {
                    if (err) {
                        throw err;
                    }

                    expect(ret.value).to.be.true;
                })
                .call(done);
        });
    });

    describe('bundle config', function() {
        it('exists and has length', function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .execute(function() {
                    return window.dashboardApi.bundleConfig;
                }, function(err, ret) {
                    if (err) {
                        throw err;
                    }

                    expect(ret.value).to.not.be.empty();
                })
                .call(done);
        });
    });

    describe('replicants', function() {
        it('only apply defaultValue when first declared', function(done) {
            e.apis.extension.Replicant('clientTest', { defaultValue: 'foo', persistent: false });

            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .executeAsync(function(done) {
                    var rep = window.dashboardApi.Replicant('clientTest', { defaultValue: 'bar' });

                    rep.on('declared', function() {
                        done(rep.value);
                    });
                }, function(err, ret) {
                    if (err) {
                        throw err;
                    }

                    expect(ret.value).to.equal('foo');
                })
                .call(done);
        });

        it('can be read once without subscription, via readReplicant', function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .executeAsync(function(done) {
                    window.dashboardApi.readReplicant('clientTest', done);
                }, function(err, ret) {
                    if (err) {
                        throw err;
                    }

                    expect(ret.value).to.equal('foo');
                })
                .call(done);
        });

        it('throws an error when no name is given to a synced variable', function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .executeAsync(function(done) {
                    try {
                        window.dashboardApi.Replicant();
                    }
                    catch (e) {
                        done(e.message);
                    }
                }, function(err, ret) {
                    if (err) {
                        throw err;
                    }

                    expect(ret.value).to.equal('Must supply a name when instantiating a Replicant');
                })
                .call(done);
        });

        it('can be assigned via the ".value" property', function (done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .executeAsync(function(done) {
                    var rep = window.dashboardApi.Replicant('clientAssignmentTest', { persistent: false });
                    rep.on('assignmentAccepted', function(data) {
                        done(data);
                    });
                    rep.value = 'assignmentOK';
                }, function(err, ret) {
                    if (err) {
                        throw err;
                    }

                    expect(ret.value.value).to.equal('assignmentOK');
                    expect(ret.value.revision).to.equal(1);
                })
                .call(done);
        });

        it('reacts to changes in nested properties of objects', function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .executeAsync(function(done) {
                    var rep = window.dashboardApi.Replicant('clientObjTest', {
                        persistent: false,
                        defaultValue: {a: {b: {c: 'c'}}}
                    });

                    rep.on('declared', function() {
                        rep.on('change', function(oldVal, newVal, changes) {
                            if (oldVal && newVal && changes) {
                                done({
                                    oldVal: oldVal,
                                    newVal: newVal,
                                    changes: changes
                                });
                            }
                        });

                        rep.value.a.b.c = 'nestedChangeOK';
                    });
                }, function(err, ret) {
                    if (err) {
                        throw err;
                    }

                    expect(ret.value.oldVal).to.deep.equal({a: {b: {c: 'c'}}});
                    expect(ret.value.newVal).to.deep.equal({a: {b: {c: 'nestedChangeOK'}}});
                    expect(ret.value.changes).to.have.length(1);
                    expect(ret.value.changes[0].type).to.equal('update');
                    expect(ret.value.changes[0].path).to.equal('a.b.c');
                    expect(ret.value.changes[0].oldValue).to.equal('c');
                    expect(ret.value.changes[0].newValue).to.equal('nestedChangeOK');
                })
                .call(done);
        });

        it('react to changes in arrays', function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .executeAsync(function(done) {
                    var rep = window.dashboardApi.Replicant('clientArrTest', {
                        persistent: false,
                        defaultValue: ['starting']
                    });

                    rep.on('declared', function() {
                        rep.on('change', function(oldVal, newVal, changes) {
                            if (oldVal && newVal && changes) {
                                done({
                                    oldVal: oldVal,
                                    newVal: newVal,
                                    changes: changes
                                });
                            }
                        });

                        rep.value.push('arrPushOK');
                    });
                }, function(err, ret) {
                    if (err) {
                        throw err;
                    }

                    expect(ret.value.oldVal).to.deep.equal(['starting']);
                    expect(ret.value.newVal).to.deep.equal(['starting', 'arrPushOK']);
                    expect(ret.value.changes).to.have.length(1);
                    expect(ret.value.changes[0].type).to.equal('splice');
                    expect(ret.value.changes[0].removed).to.deep.equal([]);
                    expect(ret.value.changes[0].removedCount).to.equal(0);
                    expect(ret.value.changes[0].added).to.deep.equal(['arrPushOK']);
                    expect(ret.value.changes[0].addedCount).to.equal(1);
                })
                .call(done);
        });

        it('load persisted values when they exist', function(done) {
            // Make sure the persisted value exists
            fs.writeFile('./db/replicants/test-bundle.clientPersistence', 'it work good!', function(err) {
                if (err) {
                    throw err;
                }

                e.browser.client
                    .switchTab(e.browser.tabs.dashboard)
                    .executeAsync(function(done) {
                        var rep = window.dashboardApi.Replicant('clientPersistence');

                        rep.on('declared', function() {
                            done(rep.value);
                        });
                    }, function(err, ret) {
                        if (err) {
                            throw err;
                        }

                        expect(ret.value).to.equal('it work good!');
                    })
                    .call(done);
            });
        });

        it('persist assignment to disk', function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .executeAsync(function(done) {
                    var rep = window.dashboardApi.Replicant('clientPersistence');
                    rep.value = { nested: 'hey we assigned!' };

                    rep.on('change', function() {
                        done();
                    });
                }, function(err) {
                    if (err) {
                        throw err;
                    }

                    fs.readFile('./db/replicants/test-bundle.clientPersistence', 'utf-8', function(err, data) {
                        if (err) {
                            throw err;
                        }

                        expect(data).to.equal('{"nested":"hey we assigned!"}');
                        done();
                    });
                });
        });

        it('persist changes to disk', function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .executeAsync(function(done) {
                    var rep = window.dashboardApi.Replicant('clientPersistence');
                    rep.value.nested = 'hey we changed!';

                    rep.on('change', function() {
                        done();
                    });
                }, function(err) {
                    if (err) {
                        throw err;
                    }

                    fs.readFile('./db/replicants/test-bundle.clientPersistence', 'utf-8', function(err, data) {
                        if (err) {
                            throw err;
                        }

                        expect(data).to.equal('{"nested":"hey we changed!"}');
                        done();
                    });
                });
        });

        it('don\'t persist when "persistent" is set to "false"', function(done) {
            fs.unlink('./db/replicants/test-bundle.clientTransience', function(err) {
                if (err && err.code !== 'ENOENT') {
                    throw err;
                }

                e.browser.client
                    .switchTab(e.browser.tabs.dashboard)
                    .executeAsync(function(done) {
                        var rep = window.dashboardApi.Replicant('clientTransience', { defaultValue: 'o no', persistent: false });

                        rep.on('declared', function() {
                            done();
                        });
                    }, function(err) {
                        if (err) {
                            throw err;
                        }

                        fs.readFile('./db/replicants/test-bundle.clientTransience', function(err) {
                            expect(function() {
                                if (err) {
                                    throw err;
                                }
                            }).to.throw(/ENOENT/);
                        });
                    })
                    .call(done);
            });
        });

        // need a better way to test this
        it.skip('redeclare after reconnecting to Socket.IO', function(done) {
            this.timeout(30000);

            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .executeAsync(function(done) {
                    window.clientRedeclare = window.dashboardApi.Replicant('clientRedeclare', { defaultValue: 'foo', persistent: false });

                    window.clientRedeclare.once('declared', function() {
                        done();
                    });
                }, function(err) {
                    if (err) {
                        throw err;
                    }

                    e.server.once('stopped', function() {
                        e.browser.client
                            .switchTab(e.browser.tabs.dashboard)
                            .executeAsync(function(done) {
                                window.clientRedeclare.once('declared', function() {
                                    done();
                                });
                            }, function(err) {
                                if (err) {
                                    throw err;
                                }
                            })
                            .call(done);

                        e.server.start();
                    });

                    e.server.stop();
                });
        });
    });
});
