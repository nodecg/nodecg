'use strict';

var file = require('file'),
    fs = require('fs'),
    configHelper = require('../config'),
    config = configHelper.getConfig(),
    _baseDir = configHelper.getBaseDirectory(),
    semver = require('semver'),
    path = require('path'),
    log = require('../logger')('nodecg/lib/bundles/parser'),
    jade = require('jade'),
    util = require('util'),
    npm = require('npm'),
    Q = require('q'),

    pjson = require('../../package.json');

module.exports = function parse(bundleName) {
    var dir = path.resolve(_baseDir, 'bundles/' + bundleName + '/');
    var manifestPath = path.join(dir, 'nodecg.json');

    // Return null if nodecg.json doesn't exist
    if (!fs.existsSync(manifestPath)) {
        return null;
    }

    log.trace("Discovered bundle in folder bundles/%s", bundleName);

    // Read metadata from the nodecg.json manifest file
    var bundle = readManifest(manifestPath);
    bundle.dir = dir;

    // Don't load the bundle if it depends on a different version of NodeCG
    if (!isCompatible(bundle.nodecgDependency)) {
        log.warn("Did not load %s as it requires NodeCG %s. Current version is %s",
            bundle.name, bundle.nodecgDependency, pjson.version);
        return null;
    }

    // If there is a config file for this bundle, parse it
    var cfgPath = path.resolve(_baseDir, 'cfg', bundle.name + '.json');
    bundle.config = readConfig(cfgPath);

    // Read all HTML/CSS/JS files in the package's "dashboard" dir into memory
    // They will then get passed to dashboard.jade at the time of 'GET' and be templated into the final rendered page
    bundle.dashboard = {};
    bundle.dashboard.dir = path.join(bundle.dir, 'dashboard');

    readDashboardResources(bundle);
    readDashboardPanels(bundle);

    // The following operation(s) are async, so we make a collective promise for them
    return Q.all([
        installNpmPackages(bundle)
    ]).then(function() {
        return bundle;
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
    if (!bundle.dependencies) {
        deferred.resolve();
        return;
    }
    npm.load({ prefix: bundle.dir, loglevel: 'warn' }, function (er) {
        if (er) {
            deferred.reject(new Error(
                util.format("[%s] Failed to load npm to install dependencies:", bundle.name, er.message)
            ));
            return;
        }
        // npm.commands.install takes an array of string arguments
        // we must take the bundle's list of deps and turn them into arg strings
        var args = [];
        for (var dep in bundle.dependencies) {
            if (!bundle.dependencies.hasOwnProperty(dep)) continue;
            args.push(dep + '@' + bundle.dependencies[dep]);
        }

        // astoundingly stupid hack to make NPM not spam the console with
        // details about EVERY SINGLE installed package
        console._stdout = { write : function () {} };
        npm.commands.install(args, function (er, data) {
            if (er) {
                deferred.reject(new Error(
                    util.format("[%s] Failed to install npm dependencies:", bundle.name, er.message)
                ));
            } else {
                deferred.resolve();
            }
            console._stdout = process.stdout;
        });
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
        log.warn("[%s] dashboard/panels.json not found or not valid, this bundle will not have any dashboard panels", bundle.name);
        return;
    }

    manifest.forEach(function(panel, index) {
        try {
            var missingProps = [];
            if (typeof(panel.name) === 'undefined') missingProps.push('name');
            if (typeof(panel.title) === 'undefined') missingProps.push('title');
            if (typeof(panel.file) === 'undefined') missingProps.push('file');
            if (missingProps.length) {
                log.error("[%s] Panel #%d could not be parsed as it is missing the following properties:", bundle.name, index, missingProps.join(', '));
                return;
            }

            panel.file = path.join(bundle.dashboard.dir, panel.file);
            panel.width = panel.width || 2;
            panel.faIcon = panel.faIcon || 'fa-question-circle';
            panel.viewUrl = panel.viewUrl || '/view/' + bundle.name;

            switch (path.extname(panel.file)) {
                case '.jade':
                    // Render the panel as Jade, giving it access to both this specific bundle's config and NodeCG's config
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
            log.error("Error parsing panel '%s' for bundle %s:\n", panel.name, bundle.name, e.message);
        }
    });
}

function readDashboardResources(bundle) {
    // Arrays with the JS, CSS, and HTML
    bundle.dashboard.js = [];
    bundle.dashboard.css = [];

    var dashboardDir;
    try {
        dashboardDir = fs.readdirSync(bundle.dashboard.dir); // returns just the filenames of each file in the folder, not full path
    } catch(e) {
        log.warn("[%s] No dashboard folder found, this bundle will not have dashboard panels", bundle.name);
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
