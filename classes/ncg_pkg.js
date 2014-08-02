var assert = require('assert'),
    fs = require('fs'),
    config = require('../config');

require('string.prototype.endswith');

function ncgPkg(dir) {
  this.dir = dir;
  this.manifestPath = this.dir + "nodecg.json";

  // Read metadata from the manifest
  this.readManifest();

  // I don't like this panel implementation, but don't know how to make it better - Lange
  // Read all HTML/CSS/JS files in the package's "admin" dir into memory
  // They will then get passed to dashboard.html at the time of 'GET' and be templated into the final rendered page
  this.admin = {};
  this.admin.dir = this.dir + '/admin';
  this.readAdminResources();

  this.view = {};
  this.view.url = 'http://' + config.host + ':' + config.port + '/view/' + this.name;
}

ncgPkg.prototype.readManifest = function() {
  // Error if nodecg.json doesn't exist
  assert.ok(fs.existsSync(this.manifestPath),
      "argument 'manifestPath' must point to an existing nodecg.json file, " + this.manifestPath + " was supplied");

  // Parse the JSON from nodecg.json
  var manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));

  // Copy the JSON we use into a the new ncgPkg object
  this.name = manifest.name;
  this.version = manifest.version;
  this.description = manifest.description;
  this.homepage = manifest.homepage;
  this.authors = manifest.authors;
  this.resolutions = manifest.resolutions;
  this.license = manifest.license;
};

ncgPkg.prototype.readAdminResources = function() {
  // Array of strings containing the panel's <div>
  this.admin.panels = [];
  // Arrays of Objects with 'type' == 'css' or 'js', and 'text' == the CSS or JS code
  this.admin.resources = [];

  var adminDir = fs.readdirSync(this.admin.dir); // returns just the filenames of each file in the folder, not full path

  adminDir.forEach(function(file) {
    if (!fs.statSync(this.dir + "/" + file).isFile()) {
      // Skip directories
      return;
    }

    var data = fs.readFileSync(this.admin.dir + "/" + file, {encoding: 'utf8'});
    if (file.endsWith('.js')) {
      this.admin.resources.push({type: 'js', text: data});
    } else if (file.endsWith('.css')) {
      this.admin.resources.push({type: 'css', text: data});
    } else if (file.endsWith('.html') || file.endsWith('.ejs')) {
      this.admin.panels.push(data);
    }
  });
};

module.exports = ncgPkg;