'use strict';

var Q = require('q');
var log = require('../../logger/index')('nodecg/lib/bundles/parser/npm');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var util = require('util');

exports = module.exports = function (bundle) {
    if (!bundle) return;

    var deferred = Q.defer();

    if (bundle.dependencies) {
        log.warn('Bundle "%s" has the "dependencies" property in its nodecg.json', bundle.name);
        log.warn('Per-bundle npm dependencies have been moved into package.json');
        log.warn('Please remove the "dependencies" field from this bundle\'s nodecg.json and ' +
        'move it into a package.json');
    }

    // Do nothing if package.json does not exist
    var packagejsonPath = path.join(bundle.dir, 'package.json');
    if (!fs.existsSync(packagejsonPath)) {
        log.trace('No npm dependencies to install for bundle', bundle.name);
        deferred.resolve();
        return deferred.promise;
    }

    exec('npm install', { cwd: bundle.dir }, function(err) {
        if (err) {
            deferred.reject(new Error(
                util.format('[%s] Failed to install npm dependencies:', bundle.name, err.message)
            ));
            return;
        }
        log.trace('Successfully installed npm dependencies for bundle', bundle.name);
        deferred.resolve();
    });

    return deferred.promise;
};
