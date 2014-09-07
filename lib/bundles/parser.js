// Exports a Parser singleton

var file = require('file'),
    assert = require('assert'),
    fs = require('fs'),
    config = require('../../config');

require('string.prototype.endswith');

function Parser() {}

Parser.prototype.parse = function(name) {
    var dir = 'bundles/' + name + '/';
    var manifestPath = dir + "nodecg.json";

    // Read metadata from the nodecg.json manifest file
    // This is the bulk of the package's attributes
    var bundle = this.readManifest(manifestPath);
    bundle.dir = dir;

    // I don't like this panel implementation, but don't know how to make it better - Lange
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
    // Error if nodecg.json doesn't exist
    assert.ok(fs.existsSync(path),
            "argument 'path' must point to an existing nodecg.json file, " + path + " was supplied");

    // Parse the JSON from nodecg.json
    var manifest = JSON.parse(fs.readFileSync(path, 'utf8'));

    // Copy the JSON we use into an object
    var bundle = {
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        homepage: manifest.homepage,
        authors: manifest.authors,
        resolutions: manifest.resolutions,
        license: manifest.license
    };

    return bundle;
};

Parser.prototype.readAdminResources = function(bundle) {
    // Array of strings containing the panel's <div>
    bundle.admin.panels = [];
    // Arrays of Objects with 'type' == 'css' or 'js', and 'text' == the CSS or JS code
    bundle.admin.resources = [];

    var adminDir = fs.readdirSync(bundle.admin.dir); // returns just the filenames of each file in the folder, not full path

    adminDir.forEach(function(file) {
        if (!fs.statSync(bundle.admin.dir + file).isFile()) {
            // Skip directories
            return;
        }

        var data = fs.readFileSync(bundle.admin.dir + file, {encoding: 'utf8'});
        if (file.endsWith('.js')) {
            bundle.admin.resources.push({type: 'js', text: data});
        } else if (file.endsWith('.css')) {
            bundle.admin.resources.push({type: 'css', text: data});
        } else if (file.endsWith('.html') || file.endsWith('.ejs')) {
            bundle.admin.panels.push(data);
        }
    });
};

module.exports = exports = new Parser();