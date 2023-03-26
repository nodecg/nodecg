// Native
import path from 'path';

// Packages
import express from 'express';

// Ours
import { authCheck, sendFile } from './util';
import type { NodeCG } from '../types/nodecg';

export default class SharedSourcesLib {
	app = express();

	constructor(bundles: NodeCG.Bundle[]) {
		this.app.get('/bundles/:bundleName/shared/*', authCheck, (req, res, next) => {
			const { bundleName } = req.params as Record<string, string>;
			const bundle = bundles.find((b) => b.name === bundleName);
			if (!bundle) {
				next();
				return;
			}

			// Essentially behave like express.static
			// Serve up files with no extra logic
			const resName = req.params[0];
			const parentDir = path.join(bundle.dir, 'shared');
			const fileLocation = path.join(parentDir, resName);
			sendFile(parentDir, fileLocation, res, next);
		});
	}
}
