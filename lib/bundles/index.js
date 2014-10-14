// Exports a Bundles singleton

var Datastore = require('nedb'),
    Parser = require('./parser.js'),
    events = require('events'),
    watcher = require('./watcher.js'),
    fs = require('fs'),
    db = new Datastore({ filename: 'db/bundles.db', autoload: true }),
    Q = require('q');

// Using a unique constraint with the bundle name
db.ensureIndex({ fieldName: 'name', unique: true }, function (err) {});

// Used in the "watcher" listener. Couldn't think of a cleaner way of doing it.
var self = {};

function Bundles() {
    self = this;

    // Do an initial scan of the bundles dir
    var bundlesDir = fs.readdirSync('bundles/');
    var discoveredBundles = [];

    bundlesDir.forEach(function(bundleFolderName) {
        var bundle = Parser.parse(bundleFolderName);

        if (bundle !== null) {
            discoveredBundles.push(bundle);
        }
    });

    // Remove any entries that are no longer present on disk,
    // add/update the rest
    self.all()
        .then(function (currentBundles) {
            currentBundles.forEach(function(bundle) {
                var bundleName = bundle.name;
                var bundleDiscovered = false;

                discoveredBundles.forEach(function (discoveredBundle) {
                    if (discoveredBundle.name === bundleName) {
                        bundleDiscovered = true;
                    }
                });

                if (!bundleDiscovered) {
                    console.log('[lib/bundle/index.js] ' + bundle.name + '\'s nodecg.json was not discovered, assuming the bundle has been deleted or moved');
                    self.remove(bundle.name);
                }
            });

            discoveredBundles.forEach(function (bundle) {
                self.add(bundle);
            });
        }, function (reason) {
            console.log('[lib/bundle/index.js] Failed bundle DB init integrity scan: ' + reason);
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
    // If the parser rejects a bundle for some reason (such as a NodeCG version mismatch), it will be null
    if(!bundle) {
        return;
    }

    // Upserting the bundle
    db.update({ name: bundle.name }, bundle, { upsert: true }, function (err, numReplaced, upsert) {
        if (upsert) {
            console.log('[lib/bundle/index.js] Added ' + bundle.name + ' to DB');
        } else {
            console.log('[lib/bundle/index.js] Updated ' + bundle.name + '\'s DB entry');
        }
    });
};

Bundles.prototype.remove = function(bundlename) {
    // options set to {} since the default for multi is false
    db.remove({ name: bundlename }, {}, function (err, numRemoved) {
        console.log('[lib/bundle/index.js] ' + bundlename + ' has been removed from the DB');
    });
};

watcher.on('bundleChanged', function (name) {
    var bundle = Parser.parse(name);

    // If nodecg.json is missing from the bundle dir, bundle will equal false
    if (bundle) {
        console.log('[lib/bundle/index.js] ' + name + ' was changed, and has been reloaded from disk');
        self.add(bundle);
    } else {
        console.log('[lib/bundle/index.js] ' + name + '\'s nodecg.json can no longer be found on disk, assuming the bundle has been deleted or moved');
        self.remove(name);
    }
});

module.exports = exports = new Bundles();