'use strict';

var log = require('../../logger')('nodecg/lib/bundles/parser/dashboard');
var fs = require('fs');
var path = require('path');

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

            // check that the jade file exists, throws error if it doesn't
            /* jshint -W016 */
            fs.accessSync(filePath, fs.F_OK | fs.R_OK);
            /* jshint +W016 */

            panel.width = panel.width || 1;

            bundle.dashboard.panels.push(panel);
        } catch (e) {
            log.error('Error parsing panel \'%s\' for bundle %s:\n', panel.name, bundle.name, e.message);
        }
    });
}
