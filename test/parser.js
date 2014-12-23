'use strict';

// Modules used to run tests
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

var path = require('path');
var fs = require('fs');
var C = require('./setup/test-constants');
var e = require('./setup/test-environment');

before(function(done) {
    this.timeout(10000);
    e.server.emitter.on('extensionsLoaded', done);
});

describe("per-bundle npm packages", function() {
    it("get installed", function () {
        var dir = path.join(C.BUNDLE_DIR, 'node_modules/commander');
        expect(fs.existsSync(dir)).to.be.true;
    });
});
