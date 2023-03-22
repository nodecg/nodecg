// Native
import path from 'path';
import os from 'os';

// Packages
import * as Sentry from '@sentry/node';
import express from 'express';
import appRootPath from 'app-root-path';

// Ours
import { config } from '../config';
import type BundleManager from '../bundle-manager';
import { authCheck, pjson } from '../util';
import type { NodeCG } from '../../types/nodecg';

const VIEWS_PATH = path.join(appRootPath.path, 'src/server/util');
const baseSentryConfig = {
	dsn: config.sentry?.dsn,
	serverName: os.hostname(),
	release: pjson.version,
};

export default class SentryConfig {
	readonly bundleMetadata: Array<{ name: string; git: NodeCG.Bundle.GitData; version: string }> = [];
	readonly app = express();

	constructor(bundleManager: BundleManager) {
		const { app, bundleMetadata } = this;
		app.set('views', VIEWS_PATH);

		bundleManager.on('ready', () => {
			Sentry.configureScope((scope) => {
				bundleManager.all().forEach((bundle) => {
					bundleMetadata.push({
						name: bundle.name,
						git: bundle.git,
						version: bundle.version,
					});
				});
				scope.setExtra('bundles', bundleMetadata);
			});
		});

		bundleManager.on('gitChanged', (bundle) => {
			const metadataToUpdate = bundleMetadata.find((data) => data.name === bundle.name);
			if (!metadataToUpdate) {
				return;
			}

			metadataToUpdate.git = bundle.git;
			metadataToUpdate.version = bundle.version;
		});

		// Render a pre-configured Sentry instance for client pages that request it.
		app.get('/sentry.js', authCheck, (_req, res) => {
			res.type('.js');
			res.render(path.join(VIEWS_PATH, 'sentry.js.tmpl'), {
				baseSentryConfig,
				bundleMetadata,
			});
		});
	}
}
