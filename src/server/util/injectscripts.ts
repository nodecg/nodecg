/* eslint-disable complexity */
// Native
import fs from 'fs';

// Packages
import cheerio from 'cheerio';
import semver from 'semver';

// Ours
import { filteredConfig } from '../config';
import { noop } from '../util';
import type { NodeCG } from '../../types/nodecg';

type Options = {
	standalone?: boolean;
	createApiInstance?: NodeCG.Bundle;
	sound?: boolean;
	fullbleed?: boolean;
};

/**
 * Injects the appropriate assets into a panel, dialog, or graphic.
 */
export default function (
	pathOrHtml: string,
	resourceType: 'panel' | 'dialog' | 'graphic',
	{ standalone = false, createApiInstance, sound = false, fullbleed = false }: Options = {} as Options,
	cb: (html: string) => void = noop,
): void {
	// Graphics only pass the path to the html file.
	// Panels and dialogs pass a cached HTML string.
	if (resourceType === 'graphic') {
		fs.readFile(pathOrHtml, { encoding: 'utf8' }, inject);
	} else {
		inject(null, pathOrHtml);
	}

	function inject(err: NodeJS.ErrnoException | undefined, html: string): void {
		if (err) {
			throw err;
		}

		const $ = cheerio.load(html);
		const scripts = [];
		const styles = [];

		// Everything needs the config
		scripts.push(`<script>window.ncgConfig = ${JSON.stringify(filteredConfig)};</script>`);

		if (resourceType === 'panel' || resourceType === 'dialog') {
			if (standalone) {
				// Load the API
				scripts.push('<script src="/nodecg-api.min.js"></script>');
			} else {
				// Panels and dialogs can grab the API from the dashboard
				scripts.push('<script>window.NodeCG = window.top.NodeCG</script>');
			}

			// Both panels and dialogs need the main default styles
			scripts.push('<link rel="stylesheet" href="/dashboard/css/panel-and-dialog-defaults.css">');

			if (standalone) {
				// Load the socket
				scripts.push('<script src="/socket.js"></script>');
			} else {
				// They both also need to reference the dashboard window's socket, rather than make their own
				scripts.push('<script>window.socket = window.top.socket;</script>');
			}

			// Likewise, they both need the contentWindow portion of the iframeResizer.
			// We put this at the start and make it async so it loads ASAP.
			if (!fullbleed) {
				scripts.unshift(
					'<script async src="/node_modules/iframe-resizer/js/iframeResizer.contentWindow.min.js">' +
						'</script>',
				);
			}

			// Panels need the default panel styles and the dialog_opener.
			if (resourceType === 'panel') {
				// In v1.1.0, we changed the Dashboard to have a dark theme.
				// This also meant that we wanted to update the default panel styles.
				// However, this technically would have been a breaking change...
				// To minimize breakage, we only inject the new styles if
				// the bundle specifically lists support for v1.0.0.
				// If it only supports v1.1.0 and on, we assume it wants the dark theme styles.
				if (createApiInstance && semver.satisfies('1.0.0', createApiInstance.compatibleRange)) {
					styles.push('<link rel="stylesheet" href="/dashboard/css/old-panel-defaults.css">');
				} else {
					styles.push('<link rel="stylesheet" href="/dashboard/css/panel-defaults.css">');
				}

				scripts.push('<script async src="/dialog_opener.js"></script>');
			} else if (resourceType === 'dialog') {
				styles.push('<link rel="stylesheet" href="/dashboard/css/dialog-defaults.css">');
			}
		} else if (resourceType === 'graphic') {
			if (global.sentryEnabled) {
				scripts.unshift(
					'<script src="/node_modules/@sentry/browser/build/bundle.es6.min.js"></script>',
					'<script src="/sentry.js"></script>',
				);
			}

			// Graphics need to create their own socket
			scripts.push('<script src="/socket.io/socket.io.js"></script>');
			scripts.push('<script src="/socket.js"></script>');

			// If this bundle has sounds, inject SoundJS
			if (sound) {
				scripts.push('<script src="/node_modules/soundjs/lib/soundjs.min.js"></script>');
			}

			// Graphics must include the API script themselves before attempting to make an instance of it
			scripts.push('<script src="/nodecg-api.min.js"></script>');
		}

		// Inject a small script to create a NodeCG API instance, if requested.
		if (createApiInstance) {
			const partialBundle = {
				name: createApiInstance.name,
				config: createApiInstance.config,
				version: createApiInstance.version,
				git: createApiInstance.git,
				_hasSounds: sound,
			};

			scripts.push(
				`<script>window.nodecg = new NodeCG(${JSON.stringify(partialBundle)}, window.socket)</script>`,
			);
		}

		// Inject the scripts required for singleInstance behavior, if requested.
		if (resourceType === 'graphic' && !(pathOrHtml.endsWith('busy.html') || pathOrHtml.endsWith('killed.html'))) {
			scripts.push('<script src="/client_registration.js"></script>');
		}

		const concattedScripts = scripts.join('\n');

		// Put our scripts before their first script or HTML import.
		// If they have no scripts or imports, put our scripts at the end of <body>.
		const theirScriptsAndImports = $('script, link[rel="import"]');
		if (theirScriptsAndImports.length > 0) {
			theirScriptsAndImports.first().before(concattedScripts);
		} else {
			$('body').append(concattedScripts);
		}

		// Prepend our styles before the first one.
		// If there are no styles, put our styles at the end of <head>.
		if (styles.length > 0) {
			const concattedStyles = styles.join('\n');
			const headStyles = $('head').find('style, link[rel="stylesheet"]');
			if (headStyles.length > 0) {
				headStyles.first().before(concattedStyles);
			} else {
				$('head').append(concattedStyles);
			}
		}

		cb($.html());
	}
}
