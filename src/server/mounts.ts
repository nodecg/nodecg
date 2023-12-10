// Native
import path from 'path';

// Packages
import express from 'express';
import { authCheck, sendFile } from './util';
import type { NodeCG } from '../types/nodecg';

export default class MountsLib {
	app = express();

	constructor(bundles: NodeCG.Bundle[]) {
		bundles.forEach((bundle) => {
			bundle.mount.forEach((mount) => {
				this.app.get(`/bundles/${bundle.name}/${mount.endpoint}/*`, authCheck, (req, res, next) => {
					const resName = req.params[0]!;
					const parentDir = path.join(bundle.dir, mount.directory);
					const fileLocation = path.join(parentDir, resName);
					sendFile(parentDir, fileLocation, res, next);
				});
			});
		});
	}
}
