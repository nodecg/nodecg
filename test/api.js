/* jshint -W030 */
'use strict';

var request = require('request');
var chai = require('chai');
var expect = chai.expect;
var e = require('./setup/test-environment');
var C = require('./setup/test-constants');

describe('client-side api', function() {
    this.timeout(10000);

    context('on the dashboard', function() {
        before(function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .call(done);
        });

        // Check for basic connectivity. The rest of the test are run from the dashboard as well.
        it('should receive messages', function(done) {
            e.browser.client
                .execute(function() {
                    window.serverToDashboardReceived = false;
                    window.dashboardApi.listenFor('serverToDashboard', function() {
                        window.serverToDashboardReceived = true;
                    });
                }, function(err) {
                    if (err) throw err;
                });

            var sendMessage = setInterval(function() {
                e.apis.extension.sendMessage('serverToDashboard');
            }, 500);

            e.browser.client
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

        it('should send messages', function(done) {
            e.apis.extension.listenFor('dashboardToServer', done);
            e.browser.client
                .execute(function() {
                    window.dashboardApi.sendMessage('dashboardToServer');
                }, function(err) {
                    if (err) throw err;
                });
        });
    });

    context('in a view', function() {
        before(function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.view)
                .call(done);
        });

        // The view and dashboard APIs use the same file
        // If dashboard API passes all its tests, we just need to make sure that the socket works
        it('should receive messages', function(done) {
            e.browser.client
                .execute(function() {
                    window.serverToViewReceived = false;
                    window.graphicApi.listenFor('serverToView', function() {
                        window.serverToViewReceived = true;
                    });
                }, function(err) {
                    if (err) throw err;
                });

            var sendMessage = setInterval(function() {
                e.apis.extension.sendMessage('serverToView');
            }, 500);

            e.browser.client
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

        it('should send messages', function(done) {
            e.apis.extension.listenFor('viewToServer', done);
            e.browser.client
                .execute(function() {
                    window.graphicApi.sendMessage('viewToServer');
                }, function(err) {
                    if (err) throw err;
                });
        });
    });

    describe('#config', function() {
        before(function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .call(done);
        });

        it('should exist and have length', function(done) {
            e.browser.client
                .execute(function() {
                    return window.dashboardApi.config;
                }, function(err, ret) {
                    if (err) throw err;
                    expect(ret.value).to.not.be.empty();
                })
                .call(done);
        });

        it('shouldn\'t reveal sensitive information', function(done) {
            e.browser.client
                .execute(function() {
                    return window.dashboardApi.config;
                }, function(err, ret) {
                    if (err) throw err;
                    expect(ret.value.login).to.not.have.property('sessionSecret');
                })
                .call(done);
        });

        it('shouldn\'t be writable', function(done) {
            e.browser.client
                .execute(function() {
                    return Object.isFrozen(window.dashboardApi.config);
                }, function(err, ret) {
                    if (err) throw err;
                    expect(ret.value).to.be.true;
                })
                .call(done);
        });
    });

    describe('#bundleConfig', function() {
        before(function(done) {
            e.browser.client
                .switchTab(e.browser.tabs.dashboard)
                .call(done);
        });

        it('should exist and have length', function(done) {
            e.browser.client
                .execute(function() {
                    return window.dashboardApi.bundleConfig;
                }, function(err, ret) {
                    if (err) throw err;
                    expect(ret.value).to.not.be.empty();
                })
                .call(done);
        });
    });
});

describe('server-side api', function() {
    it('should receive messages and fire acknowledgements', function(done) {
        this.timeout(10000);

        e.apis.extension.listenFor('clientToServer', function(data, cb) {
            cb();
        });

        e.browser.client
            .switchTab(e.browser.tabs.dashboard)
            .executeAsync(function(done) {
                window.dashboardApi.sendMessage('clientToServer', null, done);
            }, function(err) {
                if (err) throw err;
            })
            .call(done);
    });

    it('should send messages', function(done) {
        this.timeout(10000);

        e.browser.client
            .switchTab(e.browser.tabs.dashboard)
            .execute(function() {
                window.serverToClientReceived = false;
                window.dashboardApi.listenFor('serverToClient', function() {
                    window.serverToClientReceived = true;
                });
            }, function(err) {
                if (err) throw err;
            });

        var sendMessage = setInterval(function() {
            e.apis.extension.sendMessage('serverToClient');
        }, 500);

        e.browser.client
            .switchTab(e.browser.tabs.dashboard)
            .executeAsync(function(done) {
                var checkMessageReceived;
                checkMessageReceived = setInterval(function() {
                    if (window.serverToClientReceived) {
                        clearInterval(checkMessageReceived);
                        done();
                    }
                }, 50);
            }, function() {
                clearInterval(sendMessage);
            })
            .call(done);
    });

    it('should mount express middleware', function(done) {
        request(C.DASHBOARD_URL + 'test-bundle/test-route', function (error, response) {
            expect(error).to.be.null();
            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    describe('#config', function() {
        it('should exist and have length', function() {
            expect(e.apis.extension.config).to.not.be.empty();
        });

        it('shouldn\'t reveal sensitive information', function() {
            expect(e.apis.extension.config.login).to.not.have.property('sessionSecret');
        });

        it('shouldn\'t be writable', function() {
            expect(Object.isFrozen(e.apis.extension.config)).to.be.true;
        });
    });

    describe('#bundleConfig', function() {
        it('should exist and has length', function() {
            expect(e.apis.extension.bundleConfig).to.not.be.empty();
        });
    });
});
