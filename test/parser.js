'use strict';

// Modules used to run tests
var chai = require('chai');
var expect = chai.expect;
var request = require('request');

var path = require('path');
var fs = require('fs');
var C = require('./setup/test-constants');

describe('per-bundle npm packages', function() {
    it('get installed', function () {
        var dir = path.join(C.BUNDLE_DIR, 'node_modules/commander');
        expect(fs.existsSync(dir)).to.be.true();
    });
});

describe('per-bundle bower packages', function() {
    it('get installed', function () {
        var dir = path.join(C.BUNDLE_DIR, 'bower_components/webcomponentsjs');
        expect(fs.existsSync(dir)).to.be.true();
    });

    it('are accessible via /dashboard', function(done) {
        request(C.DASHBOARD_BUNDLE_URL + '/components/webcomponentsjs/webcomponents.js', function (error, response, body) {
            expect(error).to.be.null();
            expect(response.statusCode).to.equal(200);
            done();
        });
    });

    it('are accessible via /display', function(done) {
        request(C.DISPLAY_BUNDLE_URL + '/components/webcomponentsjs/webcomponents.js', function (error, response, body) {
            expect(error).to.be.null();
            expect(response.statusCode).to.equal(200);
            done();
        });
    });
});
