'use strict';

// Native
const fs = require('fs');

// Packages
const cheerio = require('cheerio');

// Ours
const config = require('../config').config;
const filteredConfig = require('../config').filteredConfig;
const ravenConfig = require('../util/raven-config');

/**
 * Injects the appropriate assets into a panel, dialog, or graphic.
 * @param {string} pathOrHtml - Either the path to an HTML file, or a string of HTML.
 * @param {('panel'|'dialog'|'graphic')} resourceType
 * @param {Object} [opts] - The options object.
 * @param {boolean} [opts.standalone=false] - Whether or not to inject the scripts required to serve a panel or dialog
 * as a standlone webpage, outside of the dashboard. Only applies when `resourceType` is `panel` or `dialog`.
 * @param {boolean} [opts.createApiInstance=false] - Whether or not to create a `nodecg` API instance object
 * in the global scope of this asset.
 * @param {boolean} [opts.singleInstance=false] - Whether or not to inject the singleInstance scripts.
 * Only applies when `resourceType` is `graphic`.
 * @param {boolean} [opts.sound=false] - Whether or not to inject the sound playback scripts.
 * Only applies when `resourceType` is `graphic`.
 * @param cb
 */
module.exports = function (pathOrHtml, resourceType, opts, cb) {
	// Graphics only pass the path to the html file.
	// Panels and dialogs pass a cached HTML string.
	if (resourceType === 'graphic') {
		fs.readFile(pathOrHtml, inject);
	} else {
		inject(null, pathOrHtml);
	}

	function inject(err, html) {
		if (err) {
			throw err;
		}

		const $ = cheerio.load(html);
		let scripts = [];
		let styles = [];

		// Everything needs the config
		scripts.push(`<script>window.ncgConfig = ${JSON.stringify(filteredConfig)};</script>`);

		if (resourceType === 'panel' || resourceType === 'dialog') {
			if (opts.standalone) {
				// Load the API
				scripts.push('<script src="/nodecg-api.min.js"></script>');
			} else {
				// Panels and dialogs can grab the API from the dashboard
				scripts.push('<script>window.NodeCG = window.top.NodeCG</script>');
			}

			// Both panels and dialogs need the main default styles
			scripts.push('<link rel="stylesheet" href="/dashboard/css/panel-and-dialog-defaults.css">');

			if (opts.standalone) {
				// Load the socket
				scripts.push('<script src="/bower_components/cookies-js/dist/cookies.min.js"></script>');
				scripts.push('<script src="/socket.io/socket.io.js"></script>');
				scripts.push(`<script>
					const params = new URLSearchParams(location.search);
					window.token = params.key || Cookies.get('socketToken');
					if (window.token) {
						window.socket = io(undefined, {query: 'token=' + window.token});
					} else {
						window.socket = io();
					}
				</script>`);
			} else {
				// They both also need to reference the dashboard window's socket, rather than make their own
				scripts.push('<script>window.socket = window.top.socket;</script>');
			}

			// Likewise, they both need the contentWindow portion of the iframeResizer.
			// We put this at the start and make it async so it loads ASAP.
			if (!opts.fullbleed) {
				scripts.unshift('<script async src="/bower_components/iframe-resizer/js/iframeResizer.contentWindow.min.js">' +
					'</script>');
			}

			// Panels need the default panel styles and the dialog_opener.
			// Dialogs need the dialog_helper.
			if (resourceType === 'panel') {
				styles.push('<link rel="stylesheet" href="/dashboard/css/panel-defaults.css">');
				scripts.push('<script async src="/dashboard/js/dialog_opener.js"></script>');
			} else if (resourceType === 'dialog') {
				styles.push('<link rel="stylesheet" href="/dashboard/css/dialog-defaults.css">');
				scripts.push('<script async src="/dashboard/js/dialog_helper.js"></script>');
			}
		} else if (resourceType === 'graphic') {
			if (config.sentry && config.sentry.enabled) {
				scripts.unshift(
					'<script src="/bower_components/raven-js/dist/raven.min.js"></script>',
					`<script>
						Raven.config('${config.sentry.publicDsn}', ${JSON.stringify(ravenConfig)}).install();
						window.addEventListener('unhandledrejection', function (err) {
							Raven.captureException(err.reason);
						});
					</script>`
				);
			}

			// Graphics need to create their own socket
			scripts.push('<script src="/socket.io/socket.io.js"></script>');

			// If login security is enabled, graphics must provide a valid token when they connect to the socket
			// They also need cookies-js and a helper to manage URL query strings
			if (config.login.enabled) {
				scripts.push('<script src="/bower_components/cookies-js/dist/cookies.min.js"></script>');
				scripts.push('<script src="/login/QueryString.js"></script>');
				scripts.push(`<script>
					window.token = qs['key'] || Cookies.get('socketToken');
					window.socket = io(undefined,{query: 'token=' + window.token});
				</script>`);
			} else {
				scripts.push('<script>window.socket = io();</script>');
			}

			// If this bundle has sounds, inject SoundJS
			if (opts.sound) {
				scripts.push('<script src="/bower_components/SoundJS/lib/soundjs-0.6.2.min.js"></script>');
			}

			// Graphics must include the API script themselves before attempting to make an instance of it
			scripts.push('<script src="/nodecg-api.min.js"></script>');
		} else {
			throw new Error(`Invalid resourceType "${resourceType}"`);
		}

		// Inject a small script to create a NodeCG API instance, if requested.
		if (opts.createApiInstance) {
			const partialBundle = {
				name: opts.createApiInstance.name,
				config: opts.createApiInstance.config,
				_hasSounds: opts.sound
			};

			scripts.push(`<script>window.nodecg = new NodeCG(${JSON.stringify(partialBundle)}, window.socket)</script>`);
		}

		// Inject the scripts required for singleInstance behavior, if requested.
		if (opts.singleInstance) {
			scripts.push('<script src="/instance/client_heart.js"></script>');
		}

		scripts = scripts.join('\n');

		// Put our scripts before their first script or HTML import.
		// If they have no scripts or imports, put our scripts at the end of <body>.
		const theirScriptsAndImports = $('script, link[rel="import"]');
		if (theirScriptsAndImports.length > 0) {
			theirScriptsAndImports.first().before(scripts);
		} else {
			$('body').append(scripts);
		}

		// Inject the needed stylesheets, if any.
		// If there are <script> tags in the head, inject before them.
		// Otherwise, add at the end of the <head>.
		if (styles.length > 0) {
			styles = styles.join('\n');

			const headScripts = $('head').find('script');
			if (headScripts.length > 0) {
				headScripts.first().before(styles);
			} else {
				$('head').append(styles);
			}
		}

		cb($.html());
	}
};
