'use strict';

var path = require('path');
var UPLOADS_FOLDER = path.resolve(__dirname, '../../uploads');

function UploadedFile(filepath, sum) {
	this.sum = sum;

	var parsedPath = path.parse(filepath);
	this.base = parsedPath.base;
	this.ext = parsedPath.ext;
	this.name = parsedPath.name;
	this.bundleName = parsedPath.dir
		.replace(UPLOADS_FOLDER + path.sep, '')
		.split(path.sep)[0];
	this.url = `/uploads/${this.bundleName}/${parsedPath.base}`;
}

module.exports = UploadedFile;
