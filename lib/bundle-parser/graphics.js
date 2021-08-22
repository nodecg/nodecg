'use strict';

const fs = require('fs');
const path = require('path');

const Ajv = require('ajv');
const ajv = new Ajv({allErrors: true});
const schema = require('../../schemas/graphic.json');
const humanizeParseErrors = require('../util/humanize-parse-erros');

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
		const validate = ajv.compile(schema);
		const result = validate(graphic);
		if (!result) {
			throw new Error(`Parsing Panel #${index} failed because of the following errors:\n${humanizeParseErrors(validate.errors)}`);
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
