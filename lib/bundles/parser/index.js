'use strict';

var fs = require('fs');
var semver = require('semver');
var path = require('path');
var log = require('../../logger/index')('nodecg/lib/bundles/parser');
var Q = require('q');
var recacheDashboardAssets = require('./dashboard');
var installNpmPackages = require('./npm');
var installBowerPackages = require('./bower');

var pjson = require('../../../package.json');

module.exports = function parse(bundleName) {
    var deferred = Q.defer();

    // resolve the path to the bundle and its nodecg.json
    var dir = path.resolve(__dirname, '../../../bundles/', bundleName);
    var manifestPath = path.join(dir, 'nodecg.json');

    // Return null if nodecg.json doesn't exist
    if (!fs.existsSync(manifestPath)) {
        deferred.resolve();
        return deferred.promise;
    }

    log.trace('Discovered bundle in folder bundles/%s', bundleName);

    // Read metadata from the nodecg.json manifest file
    var bundle = readManifest(manifestPath);
    bundle.dir = dir;

    // Don't load the bundle if it depends on a different version of NodeCG
    if (!isCompatible(bundle.nodecgDependency)) {
        log.warn('Did not load %s as it requires NodeCG %s. Current version is %s',
            bundle.name, bundle.nodecgDependency, pjson.version);
        deferred.resolve();
        return deferred.promise;
    }

    // If there is a config file for this bundle, parse it
    var cfgPath = path.resolve(__dirname, '../../../cfg/', bundle.name + '.json');
    bundle.config = readConfig(cfgPath);

    // Read all HTML/CSS/JS files in the package's "dashboard" dir into memory
    // They will then get passed to dashboard.jade at the time of 'GET' and be templated into the final rendered page
    bundle.dashboard = {};
    bundle.dashboard.dir = path.join(bundle.dir, 'dashboard');

    recacheDashboardAssets(bundle);

    // The following operation(s) are async, so we make a collective promise for them
    return Q.all([
        installNpmPackages(bundle),
        installBowerPackages(bundle)
    ])
        .then(function() {
            return bundle;
        })
        .catch(function(err) {
            log.error(err.stack);
        });
};

function readManifest(path) {
    // Parse the JSON from nodecg.json
    var manifest = JSON.parse(fs.readFileSync(path, 'utf8'));

    // Copy the JSON we use into the beginnings of our bundle object
    return {
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        homepage: manifest.homepage,
        authors: manifest.authors,
        license: manifest.license,
        nodecgDependency: manifest.nodecgDependency,
        dependencies: manifest.dependencies,
        extension: manifest.extension,
        bundleDependencies: manifest.bundleDependencies
    };
}

function readConfig(cfgPath) {
    if (!fs.existsSync(cfgPath)) {
        // Skip if config does not exist
        return {};
    }

    return JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
}

function isCompatible(nodecgDependency) {
    return !!semver.satisfies(pjson.version, nodecgDependency);
}
