'use strict';

const path = require('path');
const ASSETS_ROOT = path.join(process.env.NODECG_ROOT, 'assets');

class AssetFile {
	constructor(filepath, sum) {
		const parsedPath = path.parse(filepath);
		const parts = parsedPath.dir
			.replace(ASSETS_ROOT + path.sep, '')
			.split(path.sep);

		this.sum = sum;
		this.base = parsedPath.base;
		this.ext = parsedPath.ext;
		this.name = parsedPath.name;
		this.namespace = parts[0];
		this.category = parts[1];
		this.url = `/assets/${this.namespace}/${this.category}/${parsedPath.base}`;
	}
}

module.exports = AssetFile;
