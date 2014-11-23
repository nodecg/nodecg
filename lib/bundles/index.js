'use strict';

var Datastore = require('nedb'),
    Parser = require('./parser.js'),
    events = require('events'),
    watcher = require('./watcher.js'),
    fs = require('fs'),
    db = new Datastore({ filename: 'db/bundles.db', autoload: true }),
    Q = require('q'),
    util = require('util'),
    log = require('../logger');

// Using a unique constraint with the bundle name
db.ensureIndex({ fieldName: 'name', unique: true }, function (err) {});

// Used in the "watcher" listener
var self = {};

function Bundles() {
    log.trace("[lib/bundles/index.js] Loading bundles");
    events.EventEmitter.call(this);
    self = this;

    // Do an initial scan of the bundles dir
    var bundlesDir = fs.readdirSync('bundles/');
    var discoveredBundles = [];

    bundlesDir.forEach(function(bundleFolderName) {
        var bundle = Parser.parse(bundleFolderName);

        if (bundle !== null) {
            log.trace("[lib/bundles/index.js] Discovered bundle %s", bundle.name);
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
                    log.info("[lib/bundle/index.js] %s's nodecg.json was not discovered, assuming the bundle has been deleted or moved", bundle.name);
                    self.remove(bundle.name);
                }
            });

            var promises = [];
            discoveredBundles.forEach(function (bundle) {
                promises.push(self.add(bundle));
            });

            Q.all(promises)
                .then(function() {
                    // I am calling self.all from within a self.all callback what is wrong with me
                    return self.all();
                })
                .then(function(bundles) {
                    self.emit('allLoaded', bundles);
                });
        }, function (reason) {
            log.info("[lib/bundle/index.js] Failed bundle DB init integrity scan", reason);
        });
}

util.inherits(Bundles, events.EventEmitter);

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
        if (err || doc === null) {
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
    var deferred = Q.defer();
    db.update({ name: bundle.name }, bundle, { upsert: true }, function (err, numReplaced, upsert) {
        if (err) {
            deferred.reject(new Error(err));
        } else {
            deferred.resolve(numReplaced);
            if (upsert) {
                log.info("[lib/bundle/index.js] Added %s to DB", bundle.name);
            } else {
                log.info("[lib/bundle/index.js] Updated %s's DB entry", bundle.name);
            }
        }
    });
    return deferred.promise;
};

Bundles.prototype.remove = function(bundleName) {
    // options set to {} since the default for multi is false
    db.remove({ name: bundleName }, {}, function (err, numRemoved) {
        log.info("[lib/bundle/index.js] %s has been removed from the DB", bundleName);
    });
};

watcher.on('bundleChanged', function (name) {
    var bundle = Parser.parse(name);

    // If nodecg.json is missing from the bundle dir, bundle will equal false
    if (bundle) {
        log.info("[lib/bundle/index.js] %s was changed, and has been reloaded from disk", name);
        self.add(bundle);
    } else {
        log.info("[lib/bundle/index.js] %s's nodecg.json can no longer be found on disk, assuming the bundle has been deleted or moved", name);
        self.remove(name);
    }
});

module.exports = new Bundles();
