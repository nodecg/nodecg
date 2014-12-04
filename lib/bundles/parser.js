'use strict';

var file = require('file'),
    fs = require('fs'),
    config = require('../../lib/config').config,
    semver = require('semver'),
    path = require('path'),
    log = require('../logger');

function Parser() {}

Parser.prototype.parse = function(bundlePath) {
    var dir = 'bundles/' + bundlePath + '/';
    var manifestPath = dir + "nodecg.json";

    // Return null if nodecg.json doesn't exist
    if (!fs.existsSync(manifestPath)) {
        return null;
    }

    // Read metadata from the nodecg.json manifest file
    var bundle = this.readManifest(manifestPath);
    bundle.dir = dir;

    // Don't load the bundle if it depends on a different version of NodeCG
    if (this.checkVersion(bundle) === false) {
        return null;
    }

    // If there is a config file for this bundle, parse it
    this.readConfig(bundle);

    // Read all HTML/CSS/JS files in the package's "dashboard" dir into memory
    // They will then get passed to dashboard.jade at the time of 'GET' and be templated into the final rendered page
    bundle.dashboard = {};
    bundle.dashboard.dir = bundle.dir + 'dashboard/';
    this.readDashboardResources(bundle);

    bundle.view = {};
    bundle.view.url = 'http://' + config.host + ':' + config.port + '/view/' + bundle.name;

    return bundle;
};

Parser.prototype.readManifest = function(path) {
    // Parse the JSON from nodecg.json
    var manifest = JSON.parse(fs.readFileSync(path, 'utf8'));

    // Copy the JSON we use into the beginnings of our bundle object
    return {
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        homepage: manifest.homepage,
        authors: manifest.authors,
        resolutions: manifest.resolutions,
        license: manifest.license,
        nodecgDependency: manifest.nodecgDependency,
        extension: manifest.extension,
        bundleDependencies: manifest.bundleDependencies,
    };
};

Parser.prototype.readDashboardResources = function(bundle) {
    // Arrays with the JS, CSS, and HTML
    bundle.dashboard.js = [];
    bundle.dashboard.css = [];
    bundle.dashboard.html = [];

    if (!fs.existsSync(bundle.dashboard.dir)) {
        // Skip if 'dashboard' dir does not exist
        return;
    }

    var dashboardDir = fs.readdirSync(bundle.dashboard.dir); // returns just the filenames of each file in the folder, not full path
    dashboardDir.forEach(function(file) {
        var filepath = bundle.dashboard.dir + file;
        if (!fs.statSync(filepath).isFile()) {
            // Skip directories
            return;
        }

        // Panels are strictly limited to HTML, JS, and CSS. No EJS, Jade, LESS, SASS, etc.
        switch (path.extname(filepath)) {
            case '.html':
                bundle.dashboard.html.push(fs.readFileSync(filepath, {encoding: 'utf8'}));
                break;
            case '.js':
                bundle.dashboard.js.push(fs.readFileSync(filepath, {encoding: 'utf8'}));
                break;
            case '.css':
                bundle.dashboard.css.push(fs.readFileSync(filepath, {encoding: 'utf8'}));
                break;
        }
    });
};

Parser.prototype.readConfig = function(bundle) {
    var cfgPath = path.resolve(process.cwd(), '/cfg/', bundle.name, '.cfg');
    if (!fs.existsSync(cfgPath)) {
        // Skip if config does not exist
        return;
    }

    bundle.config = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
};

Parser.prototype.checkVersion = function(bundle) {
    var pjson = require('../../package.json');
    if (semver.satisfies(pjson.version, bundle.nodecgDependency)) {
        return true;
    } else {
        log.error("[lib/bundles/parser.js] Did not load %s as it requires NodeCG %s. Current version is %s",
            bundle.name, bundle.nodecgDependency, pjson.version);
        return false;
    }
};

module.exports = new Parser();
