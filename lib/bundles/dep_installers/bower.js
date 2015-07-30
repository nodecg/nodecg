'use strict';

var Q = require('q');
var log = require('../../logger')('nodecg/lib/bundles/dep_installers/bower');
var fs = require('fs');
var path = require('path');
var bower = require('bower');
var util = require('util');

exports = module.exports = function(bundle) {
    if (!bundle) return;

    var deferred = Q.defer();

    // Do nothing if bower.json does not exist
    var packagejsonPath = path.join(bundle.dir, 'bower.json');
    if (!fs.existsSync(packagejsonPath)) {
        log.trace('No Bower dependencies to install for bundle', bundle.name);
        deferred.resolve();
        return deferred.promise;
    }

    bower.commands.install(undefined, undefined, { cwd: bundle.dir })
        .on('end', function() {
            log.trace('Successfully installed Bower dependencies for bundle', bundle.name);
            deferred.resolve();
        })
        .on('error', function(error) {
            deferred.reject(new Error(
                util.format('[%s] Failed to install Bower dependencies:', bundle.name, error.message)
            ));
        });

    return deferred.promise;
};
