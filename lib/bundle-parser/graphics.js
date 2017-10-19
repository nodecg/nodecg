'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function (graphicsDir, bundle) {
	const graphics = [];

	// If the graphics folder exists but the nodecg.graphics property doesn't, throw an error.
	if (fs.existsSync(graphicsDir) && typeof bundle.graphics === 'undefined') {
		throw new Error(`${bundle.name} has a "graphics" folder, ` +
			'but no "nodecg.graphics" property was found in its package.json');
	}

	// If nodecg.graphics exists but the graphics folder doesn't, throw an error.
	if (!fs.existsSync(graphicsDir) && typeof bundle.graphics !== 'undefined') {
		throw new Error(`${bundle.name} has a "nodecg.graphics" property in its package.json, ` +
			'but no "graphics" folder');
	}

	// If neither the folder nor the manifest exist, return an empty array.
	if (!fs.existsSync(graphicsDir) && typeof bundle.graphics === 'undefined') {
		return graphics;
	}

	bundle.graphics.forEach((graphic, index) => {
		const missingProps = [];
		if (typeof graphic.file === 'undefined') {
			missingProps.push('file');
		}

		if (typeof graphic.width === 'undefined') {
			missingProps.push('width');
		}

		if (typeof graphic.height === 'undefined') {
			missingProps.push('height');
		}

		if (missingProps.length) {
			throw new Error(`Graphic #${index} could not be parsed as it is missing the following properties: ` +
				`${missingProps.join(', ')}`);
		}

		// Check if this bundle already has a graphic for this file
		const dupeFound = graphics.some(g => g.file === graphic.file);
		if (dupeFound) {
			throw new Error(`Graphic #${index} (${graphic.file}) has the same file as another graphic in ${bundle.name}`);
		}

		const filePath = path.join(graphicsDir, graphic.file);

		// Check that the panel file exists, throws error if it doesn't
		fs.accessSync(filePath, fs.F_OK | fs.R_OK);

		// Calculate the graphic's url
		graphic.url = `/bundles/${bundle.name}/graphics/${graphic.file}`;

		graphics.push(graphic);
	});

	return graphics;
};
