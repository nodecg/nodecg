// Exports a Parser singleton

var file = require('file'),
    fs = require('fs'),
    config = require('../../lib/config'),
    semver = require('semver'),
    path = require('path');

function Parser() {}

Parser.prototype.parse = function(name) {
    var dir = 'bundles/' + name + '/';
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
        nodecgDependency: manifest.nodecgDependency
    };
};

Parser.prototype.readAdminResources = function(bundle) {
    // Arrays with the JS, CSS, and HTML (raw HTML or a template lang like Jade or EJS)
    bundle.admin.js = [];
    bundle.admin.css = [];
    bundle.admin.html = [];

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
        console.error('[lib/bundles/parser.js] Did not load ' + bundle.name + ', as it requires NodeCG ' + bundle.nodecgDependency + '. Current version: ' + pjson.version);
        return false;
    }
};

module.exports = exports = new Parser();