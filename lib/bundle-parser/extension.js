'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function (bundleDir, bundle) {
	const singleFilePath = path.resolve(bundleDir, 'extension.js');
	const directoryPath = path.resolve(bundleDir, 'extension');
	const singleFileExists = fs.existsSync(singleFilePath);
	const directoryExists = fs.existsSync(directoryPath);

	// If there is a file named "extension", throw an error. It should be a directory.
	if (directoryExists && !fs.lstatSync(directoryPath).isDirectory()) {
		throw new Error(`${bundle.name} has an illegal file named "extension" in its root. ` +
			'Either rename it to "extension.js", or make a directory named "extension"');
	}

	// If both "extension.js" and a directory named "extension" exist, throw an error.
	if (singleFileExists && directoryExists) {
		throw new Error(`${bundle.name} has both "extension.js" and a folder named "extension". ` +
			'There can only be one of these, not both.');
	}

	// Return "true" if either "extension.js" or a directory named "extension" exist.
	return singleFileExists || directoryExists;
};
