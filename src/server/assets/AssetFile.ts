// Native
import * as path from 'path';

// Ours
import { NodeCG } from '../../types/nodecg';

const ASSETS_ROOT = path.join(process.env.NODECG_ROOT, 'assets');

export default class AssetFile implements NodeCG.AssetFile {
	sum: string;

	base: string;

	ext: string;

	name: string;

	namespace: string;

	category: string;

	url: string;

	constructor(filepath: string, sum: string) {
		const parsedPath = path.parse(filepath);
		const parts = parsedPath.dir.replace(ASSETS_ROOT + path.sep, '').split(path.sep);

		this.sum = sum;
		this.base = parsedPath.base;
		this.ext = parsedPath.ext;
		this.name = parsedPath.name;
		this.namespace = parts[0];
		this.category = parts[1];
		this.url = `/assets/${this.namespace}/${this.category}/${encodeURIComponent(this.base)}`;
	}
}
