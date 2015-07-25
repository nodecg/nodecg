'use strict';

var log = require('../../logger')('nodecg/lib/bundles/parser/dashboard');
var fs = require('fs');
var path = require('path');
var cheerio = require('cheerio');

module.exports = function(bundle) {
    if (!bundle) return;
    readDashboardPanels(bundle);
};

function readDashboardPanels(bundle) {
    bundle.dashboard.panels = [];
    var manifestPath = path.join(bundle.dashboard.dir, 'panels.json');

    var manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch(e) {
        // Only warn if the dashboard folder exists.
        // Otherwise, assume that the lack of panels is intentional.
        if (fs.existsSync(bundle.dashboard.dir)) {
            log.warn('[%s] dashboard/panels.json not found or not valid, '
                + 'this bundle will not have any dashboard panels', bundle.name);
        }
        return;
    }

    manifest.forEach(function(panel, index) {
        try {
            var missingProps = [];
            if (typeof(panel.name) === 'undefined') missingProps.push('name');
            if (typeof(panel.title) === 'undefined') missingProps.push('title');
            if (typeof(panel.file) === 'undefined') missingProps.push('file');
            if (missingProps.length) {
                log.error('[%s] Panel #%d could not be parsed as it is missing the following properties:',
                    bundle.name, index, missingProps.join(', '));
                return;
            }

            // Check if this bundle already has a panel by this name
            var dupeFound = bundle.dashboard.panels.some(function(p) {
                return p.name === panel.name;
            });
            if (dupeFound) {
                log.error('[%s] Panel #%d (%s) has the same name as another panel in this bundle, '
                    + 'and will not be loaded.', bundle.name, index, panel.name);
                return;
            }

            var filePath = path.join(bundle.dashboard.dir, panel.file);

            // check that the panel file exists, throws error if it doesn't
            /* jshint -W016 */
            fs.accessSync(filePath, fs.F_OK | fs.R_OK);
            /* jshint +W016 */

            var $ = cheerio.load(fs.readFileSync(filePath));

            // Check that the panel has a <head> tag, which we need to inject our scripts.
            if ($('head').length < 1) {
                log.error('Panel "%s" in bundle "%s" has no <head>, cannot inject scripts. Panel will not be loaded.',
                    path.basename(panel.file), bundle.name);
                return;
            }

            // Check that the panel has a DOCTYPE
            var html = $.html();
            if (html.indexOf('<!DOCTYPE') < 0) {
                log.error('Panel "%s" in bundle "%s" has no DOCTYPE, panel resizing will not work. '
                    + 'Panel will not be loaded.', path.basename(panel.file), bundle.name);
                return;
            }

            panel.width = panel.width || 1;
            panel.dialog = !!panel.dialog; // No undefined please

            bundle.dashboard.panels.push(panel);
        } catch (e) {
            log.error('Error parsing panel \'%s\' for bundle %s:\n', panel.name, bundle.name, e.message);
        }
    });
}
