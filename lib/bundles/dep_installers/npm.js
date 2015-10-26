'use strict';

var Q = require('q');
var log = require('../../logger')('nodecg/lib/bundles/dep_installers/npm');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var util = require('util');
var os = require('os');
var format = require('util').format;
var config = require('../../config').getConfig();
var npmPath = require('npm-path');
var extend = require('extend');

var npmEnv = extend(true, {}, process.env);
npmEnv[npmPath.PATH] = npmPath.getSync();

exports = module.exports = function (bundle) {
    if (!bundle) return;

    var deferred = Q.defer();

    // Do nothing if package.json does not exist
    var packagejsonPath = path.join(bundle.dir, 'package.json');
    if (!fs.existsSync(packagejsonPath)) {
        log.trace('No npm dependencies to install for bundle', bundle.name);
        deferred.resolve();
        return deferred.promise;
    }

    if (config.syncNpm) {
        try {
            process.stdout.write(format('Verifying/installing npm deps for bundle %s...', bundle.name));
            execSync('npm install', { cwd: bundle.dir, stdio: ['pipe', 'pipe', 'pipe'], env: npmEnv });
            log.trace('Successfully installed npm dependencies for bundle', bundle.name);
            deferred.resolve();
            process.stdout.write(' done!' + os.EOL);
        } catch (e) {
            process.stdout.write(' failed!' + os.EOL);
            console.error(e.stack);
            deferred.reject(new Error(
                util.format('[%s] Failed to install npm dependencies:', bundle.name, e.message)
            ));
        }
    } else {
        exec('npm install', { cwd: bundle.dir, env: npmEnv }, function(err) {
            if (err) {
                deferred.reject(new Error(
                    util.format('[%s] Failed to install npm dependencies:', bundle.name, err.message)
                ));
                return;
            }
            log.trace('Successfully installed npm dependencies for bundle', bundle.name);
            deferred.resolve();
        });
    }

    return deferred.promise;
};
