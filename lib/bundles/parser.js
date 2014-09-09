// Exports a Parser singleton

var file = require('file'),
    fs = require('fs'),
    config = require('../../config'),
    jade = require('jade');

require('string.prototype.endswith');

function Parser() {}

Parser.prototype.parse = function(name) {
    var dir = 'bundles/' + name + '/';
    var manifestPath = dir + "nodecg.json";

    // Return false if nodecg.json doesn't exist
    if (!fs.existsSync(manifestPath)) {
        return false;
    }

    // Read metadata from the nodecg.json manifest file
    var bundle = this.readManifest(manifestPath);
    bundle.dir = dir;

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
        license: manifest.license
    };
};

Parser.prototype.readAdminResources = function(bundle) {
    // Arrays with the JS, CSS, and HTML (raw HTML or a template lang like Jade or EJS)
    bundle.admin.scripts = [];
    bundle.admin.styles = [];
    bundle.admin.markups = [];

    var scriptsDir = fs.readdirSync(bundle.admin.dir + 'js/'); // returns just the filenames of each file in the folder, not full path
    scriptsDir.forEach(function(file) {
        if (!fs.statSync(bundle.admin.dir + 'js/' + file).isFile()) {
            // Skip directories
            return;
        }

        var data = fs.readFileSync(bundle.admin.dir + 'js/' + file, {encoding: 'utf8'});
        bundle.admin.scripts.push(data);
    });

    var stylesDir = fs.readdirSync(bundle.admin.dir + 'css/');
    stylesDir.forEach(function(file) {
        if (!fs.statSync(bundle.admin.dir + 'css/' + file).isFile()) {
            // Skip directories
            return;
        }

        var data = fs.readFileSync(bundle.admin.dir + 'css/' + file, {encoding: 'utf8'});
        bundle.admin.styles.push(data);
    });

    var markupsDir = fs.readdirSync(bundle.admin.dir + 'html/');
    markupsDir.forEach(function(file) {
        if (!fs.statSync(bundle.admin.dir + 'html/' + file).isFile()) {
            // Skip directories
            return;
        }

        var html = renderToString(bundle.admin.dir + 'html/' + file)
        bundle.admin.markups.push(html);
    });
};

function renderToString(filePath) {
    /*  TODO: Make this more dynamic, it should accept any file type and try its best to render it, like Express does
        Maybe there is some way to make express handle this rendering?
     */

    if (filePath.endsWith('.jade')) {
        return jade.renderFile(filePath);
    } else if (filePath.endsWith('.ejs') || filePath.endsWith('.html')) {
        return ejs.renderFile(filePath);
    } else {
        console.error('[lib/bundles/parser.js] Unregocnized markup file type: ' + filePath +
                      '\nCurrently accepted types are: .jade, .ejs, .html');
    }
}

module.exports = exports = new Parser();