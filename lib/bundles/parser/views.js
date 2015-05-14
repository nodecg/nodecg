'use strict';

var log = require('../../logger')('nodecg/lib/bundles/parser/view');
var fs = require('fs');
var jade = require('jade');
var configHelper = require('../../config');
var config = configHelper.getConfig();
var path = require('path');

exports = module.exports = function(bundle) {
    if (!bundle) return;
    readDisplayViews(bundle);
};

function readDisplayViews(bundle) {
    bundle.display.views = [];
    var manifestPath = path.join(bundle.display.dir, 'views.json');

    var manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch(e) {
        // Only warn if the display folder exists.
        // Otherwise, assume that the lack of views is intentional.
        if (fs.existsSync(bundle.display.dir)) {
            log.warn('[%s] display/views.json not found or not valid, this bundle will not have any views',
                bundle.name);
        }
        return;
    }

    manifest.forEach(function(view, index) {
        try {
            var missingProps = [];
            if (typeof(view.name) === 'undefined') missingProps.push('name');
            if (typeof(view.file) === 'undefined') missingProps.push('file');
            if (typeof(view.element) === 'undefined') missingProps.push('element');
            if (missingProps.length) {
                log.error('[%s] View #%d could not be parsed as it is missing the following properties:',
                    bundle.name, index, missingProps.join(', '));
                return;
            }

            // check that the element file exists, throws error if it doesn't
            fs.accessSync(path.join(bundle.display.dir, view.file), fs.F_OK | fs.R_OK);

            view.optimalDisplayRes = view.optimalDisplayRes || {};

            if (view.optimalDisplayRes.width && !view.optimalDisplayRes.height) {
                view.optimalDisplayRes.height = view.optimalDisplayRes.width / 16 * 9;
            }
            else if (!view.optimalDisplayRes.width && view.optimalDisplayRes.height) {
                view.optimalDisplayRes.width = view.optimalDisplayRes.height / 9 * 16;
            }
            else if (!view.optimalDisplayRes.width && !view.optimalDisplayRes.height) {
                view.optimalDisplayRes.width = 1280;
                view.optimalDisplayRes.height = 720;
            }

            bundle.display.views.push(view);
        } catch (e) {
            log.error('Error parsing view \'%s\' for bundle %s:\n', view.name, bundle.name, e.message);
        }
    });
}
