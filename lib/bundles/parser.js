'use strict';

var fs = require('fs');
var configHelper = require('../config');
var config = configHelper.getConfig();
var semver = require('semver');
var path = require('path');
var log = require('../logger')('nodecg/lib/bundles/parser');
var jade = require('jade');
var util = require('util');
var Q = require('q');
var exec = require('child_process').exec;
var bower = require('bower');

var pjson = require('../../package.json');

module.exports = function parse(bundleName) {
    var deferred = Q.defer();

    // resolve the path to the bundle and its nodecg.json
    var dir = path.resolve(__dirname, '../../bundles/', bundleName);
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
    var cfgPath = path.resolve(__dirname, '../../cfg/', bundle.name + '.json');
    bundle.config = readConfig(cfgPath);

    // Read all HTML/CSS/JS files in the package's "dashboard" dir into memory
    // They will then get passed to dashboard.jade at the time of 'GET' and be templated into the final rendered page
    bundle.dashboard = {};
    bundle.dashboard.dir = path.join(bundle.dir, 'dashboard');

    readDashboardResources(bundle);
    readDashboardPanels(bundle);

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

function installNpmPackages(bundle) {
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
}

function installBowerPackages(bundle) {
    var deferred = Q.defer();

    // Do nothing if bower.json does not exist
    var packagejsonPath = path.join(bundle.dir, 'bower.json');
    if (!fs.existsSync(packagejsonPath)) {
        log.trace('No Bower dependencies to install for bundle', bundle.name);
        deferred.resolve();
        return deferred.promise;
    }

    bower.commands.install(undefined, undefined, { cwd: bundle.dir })
        .on('end', function(installed) {
            log.trace('Successfully installed Bower dependencies for bundle', bundle.name);
            deferred.resolve();
        })
        .on('error', function(error) {
            deferred.reject(new Error(
                util.format('[%s] Failed to install Bower dependencies:', bundle.name, error.message)
            ));
        });

    return deferred.promise;
}

function readDashboardPanels(bundle) {
    bundle.dashboard.panels = [];
    var manifestPath = path.join(bundle.dashboard.dir, 'panels.json');

    var manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch(e) {
        log.warn('[%s] dashboard/panels.json not found or not valid, this bundle will not have any dashboard panels',
            bundle.name);
        return;
    }

    manifest.forEach(function(panel, index) {
        try {
            var missingProps = [];
            if (typeof(panel.name) === 'undefined') missingProps.push('name');
            if (typeof(panel.title) === 'undefined') missingProps.push('title');
            if (typeof(panel.file) === 'undefined') missingProps.push('file');
            if (missingProps.length) {
                log.error('[%s] Panel #%d could not be parsed as it is missing the following properties:',
                    bundle.name, index, missingProps.join(', '));
                return;
            }

            panel.file = path.join(bundle.dashboard.dir, panel.file);
            panel.width = panel.width || 2;
            panel.faIcon = panel.faIcon || 'fa-question-circle';
            panel.viewUrl = panel.viewUrl || '/view/' + bundle.name;

            switch (path.extname(panel.file)) {
                case '.jade':
                    // Render the panel as Jade, giving it access to both
                    // this specific bundle's config and NodeCG's config
                    panel.body = jade.renderFile(panel.file, {
                        bundleConfig: bundle.config,
                        ncgConfig: config
                    });
                    break;
                case '.html':
                    // Copy the HTML verbatim with no further processing
                    panel.body = fs.readFileSync(panel.file, {encoding: 'utf8'});
                    break;
            }


            bundle.dashboard.panels.push(panel);
        } catch (e) {
            log.error('Error parsing panel \'%s\' for bundle %s:\n', panel.name, bundle.name, e.message);
        }
    });
}

function readDashboardResources(bundle) {
    // Arrays with the JS, CSS, and HTML
    bundle.dashboard.js = [];
    bundle.dashboard.css = [];

    var dashboardDir;
    try {
        // returns just the filenames of each file in the folder, not full path
        dashboardDir = fs.readdirSync(bundle.dashboard.dir);
    } catch(e) {
        // This used to log a message, but the message in readDashboardPanels() makes it redundant.
        return;
    }

    dashboardDir.forEach(function(file) {
        var filepath = path.join(bundle.dashboard.dir, file);
        if (!fs.statSync(filepath).isFile()) {
            // Skip directories
            return;
        }

        switch (path.extname(filepath)) {
            case '.js':
                bundle.dashboard.js.push(fs.readFileSync(filepath, {encoding: 'utf8'}));
                break;
            case '.css':
                bundle.dashboard.css.push(fs.readFileSync(filepath, {encoding: 'utf8'}));
                break;
        }
    });
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
