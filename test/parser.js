'use strict';

// Modules used to run tests
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

var path = require('path');
var fs = require('fs');
var C = require('./setup/test-constants');

describe("per-bundle npm packages", function() {
    it("get installed", function () {
        var dir = path.join(C.BUNDLE_DIR, 'node_modules/commander');
        expect(fs.existsSync(dir)).to.be.true();
    });
});
