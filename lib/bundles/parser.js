'use strict';

var file = require('file'),
    fs = require('fs'),
    config = require('../../lib/config'),
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

    // Read all HTML/CSS/JS files in the package's "admin" dir into memory
    // They will then get passed to dashboard.jade at the time of 'GET' and be templated into the final rendered page
    bundle.admin = {};
    bundle.admin.dir = bundle.dir + 'admin/';
    this.readAdminResources(bundle);

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
        bundleDependencies: manifest.bundleDependencies
    };
};

Parser.prototype.readAdminResources = function(bundle) {
    // Arrays with the JS, CSS, and HTML
    bundle.admin.js = [];
    bundle.admin.css = [];
    bundle.admin.html = [];

    if (!fs.existsSync(bundle.admin.dir)) {
        // Skip if 'admin' dir does not exist
        return;
    }

    var adminDir = fs.readdirSync(bundle.admin.dir); // returns just the filenames of each file in the folder, not full path
    adminDir.forEach(function(file) {
        var filepath = bundle.admin.dir + file;
        if (!fs.statSync(filepath).isFile()) {
            // Skip directories
            return;
        }

        // Panels are strictly limited to HTML, JS, and CSS. No EJS, Jade, LESS, SASS, etc.
        switch (path.extname(filepath)) {
            case '.html':
                bundle.admin.html.push(fs.readFileSync(filepath, {encoding: 'utf8'}));
                break;
            case '.js':
                bundle.admin.js.push(fs.readFileSync(filepath, {encoding: 'utf8'}));
                break;
            case '.css':
                bundle.admin.css.push(fs.readFileSync(filepath, {encoding: 'utf8'}));
                break;
        }
    });
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
