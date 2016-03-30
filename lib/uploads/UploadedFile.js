'use strict';

const path = require('path');
const UPLOADS_FOLDER = path.resolve(__dirname, '../../uploads');

class UploadedFile {
	constructor(filepath, sum) {
		const parsedPath = path.parse(filepath);
		this.sum = sum;
		this.base = parsedPath.base;
		this.ext = parsedPath.ext;
		this.name = parsedPath.name;
		this.bundleName = parsedPath.dir
			.replace(UPLOADS_FOLDER + path.sep, '')
			.split(path.sep)[0];
		this.url = `/uploads/${this.bundleName}/${parsedPath.base}`;
	}
}

module.exports = UploadedFile;
