'use strict';

const path = require('path');
const UPLOADS_FOLDER = path.resolve(__dirname, '../../uploads');

class UploadedFile {
	constructor(filepath, sum) {
		const parsedPath = path.parse(filepath);
		const parts = parsedPath.dir
			.replace(UPLOADS_FOLDER + path.sep, '')
			.split(path.sep);

		this.sum = sum;
		this.base = parsedPath.base;
		this.ext = parsedPath.ext;
		this.name = parsedPath.name;
		this.bundleName = parts[0];
		this.category = parts[1];
		this.url = `/uploads/${this.bundleName}/${this.category}/${parsedPath.base}`;
	}
}

module.exports = UploadedFile;
