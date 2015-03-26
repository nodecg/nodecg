'use strict';

var log = require('../../logger/index')('nodecg/lib/bundles/parser/dashboard');
var fs = require('fs');
var jade = require('jade');
var configHelper = require('../../config/index');
var config = configHelper.getConfig();
var path = require('path');

exports = module.exports = function(bundle) {
    if (!bundle) return;
    readDashboardResources(bundle);
    readDashboardPanels(bundle);
};

function readDashboardPanels(bundle) {
    bundle.dashboard.panels = [];
    var manifestPath = path.join(bundle.dashboard.dir, 'panels.json');

    var manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch(e) {
        log.warn('[%s] dashboard/panels.json not found or not valid, this bundle will not have any dashboard panels',
            bundle.name);
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

            panel.file = path.join(bundle.dashboard.dir, panel.file);
            panel.width = panel.width || 2;
            panel.faIcon = panel.faIcon || 'fa-question-circle';
            panel.viewUrl = panel.viewUrl || '/view/' + bundle.name;

            switch (path.extname(panel.file)) {
                case '.jade':
                    // Render the panel as Jade, giving it access to both
                    // this specific bundle's config and NodeCG's config
                    panel.body = jade.renderFile(panel.file, {
                        bundleConfig: bundle.config,
                        bundleName: bundle.name,
                        ncgConfig: config
                    });
                    break;
                case '.html':
                    // Copy the HTML verbatim with no further processing
                    panel.body = fs.readFileSync(panel.file, {encoding: 'utf8'});
                    break;
            }


            bundle.dashboard.panels.push(panel);
        } catch (e) {
            log.error('Error parsing panel \'%s\' for bundle %s:\n', panel.name, bundle.name, e.message);
        }
    });
}

function readDashboardResources(bundle) {
    // Arrays with the JS, CSS, and HTML
    bundle.dashboard.js = [];
    bundle.dashboard.css = [];

    var dashboardDir;
    try {
        // returns just the filenames of each file in the folder, not full path
        dashboardDir = fs.readdirSync(bundle.dashboard.dir);
    } catch(e) {
        // This used to log a message, but the message in readDashboardPanels() makes it redundant.
        return;
    }

    dashboardDir.forEach(function(file) {
        var filepath = path.join(bundle.dashboard.dir, file);
        if (!fs.statSync(filepath).isFile()) {
            // Skip directories
            return;
        }

        switch (path.extname(filepath)) {
            case '.js':
                bundle.dashboard.js.push(fs.readFileSync(filepath, {encoding: 'utf8'}));
                break;
            case '.css':
                bundle.dashboard.css.push(fs.readFileSync(filepath, {encoding: 'utf8'}));
                break;
        }
    });
}
