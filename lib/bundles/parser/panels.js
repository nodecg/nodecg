'use strict';

var log = require('../../logger')('nodecg/lib/bundles/parser/dashboard');
var fs = require('fs');
var jade = require('jade');
var configHelper = require('../../config');
var config = configHelper.getConfig();
var path = require('path');

exports = module.exports = function(bundle) {
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
            log.warn('[%s] dashboard/panels.json not found or not valid, this bundle will not have any dashboard panels',
                bundle.name);
        }
        return;
    }

    manifest.forEach(function(panel, index) {
        try {
            var missingProps = [];
            if (typeof(panel.name) === 'undefined') missingProps.push('name');
            if (typeof(panel.title) === 'undefined') missingProps.push('title');
            if (typeof(panel.file) === 'undefined') missingProps.push('file');
            if (typeof(panel.element) === 'undefined') missingProps.push('element');
            if (missingProps.length) {
                log.error('[%s] Panel #%d could not be parsed as it is missing the following properties:',
                    bundle.name, index, missingProps.join(', '));
                return;
            }

            // check that the element file exists, throws error if it doesn't
            fs.accessSync(path.join(bundle.dashboard.dir, panel.file), fs.F_OK | fs.R_OK);

            panel.width = panel.width || 1;

            bundle.dashboard.panels.push(panel);
        } catch (e) {
            log.error('Error parsing panel \'%s\' for bundle %s:\n', panel.name, bundle.name, e.message);
        }
    });
}
