// Exports a Bundles singleton

var Datastore = require('nedb'),
    Parser = require('./parser.js'),
    events = require('events'),
    watcher = require('./watcher.js'),
    fs = require('fs'),
    db = new Datastore({ filename: 'db/bundles.db', autoload: true }),
    Q = require('Q');

// Used in the "watcher" listener. Couldn't think of a cleaner way of doing it.
var self = {};

function Bundles() {
    self = this;

    // Using a unique constraint with the bundle name
    db.ensureIndex({ fieldName: 'name', unique: true }, function (err) {});

    // Do an initial scan of the bundles dir
    var bundlesDir = fs.readdirSync('bundles/');

    bundlesDir.forEach(function(bndlName) {
        // Skip if nodecg.json doesn't exist
        var bndlPath = 'bundles/' + bndlName + '/';
        if (!fs.existsSync(bndlPath + "nodecg.json")) {
            return;
        }

        console.log('[lib/bundle/index.js] Loading ' + bndlName);
        var bundle = Parser.parse(bndlName);
        self.add(bundle);
    });
}

Bundles.prototype.all = function() {
    // Find all bundles in the datastore
    var deferred = Q.defer();
    db.find({}, function (err, docs) {
        if (err) {
            deferred.reject(new Error(err));
        } else {
            deferred.resolve(docs);
        }
    });
    return deferred.promise;
};

Bundles.prototype.find = function(name) {
    // Find a bundle by name
    var deferred = Q.defer();
    db.findOne({ name: name }, function (err, doc) {
        if (err) {
            deferred.reject(new Error(err));
        } else {
            deferred.resolve(doc);
        }
    });
    return deferred.promise;
};

Bundles.prototype.add = function(bundle) {
    // Upserting the bundle
    db.update({ name: bundle.name }, bundle, { upsert: true }, function (err, numReplaced, upsert) {
        if (upsert) {
            console.log('[lib/bundle/index.js] Added ' + bundle.name);
        } else {
            console.log('[lib/bundle/index.js] Updated ' + bundle.name);
        }
    });
};

watcher.on('bundleChanged', function (name) {
    console.log('[lib/bundle/index.js] Reloading ' + name);
    var bundle = Parser.parse(name);
    self.add(bundle);
});

module.exports = exports = new Bundles();