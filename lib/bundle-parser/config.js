'use strict';

// Native
const path = require('path');
const fs = require('fs');

// Packages
const clone = require('clone');
const defaults = require('json-schema-defaults');
const extend = require('extend');
const Ajv = require('ajv');
const ajv = new Ajv();

module.exports.parse = function (bundle, cfgPath) {
	if (!fs.existsSync(cfgPath)) {
		throw new Error(`bundleCfgPath "${cfgPath}" does not exist`);
	}

	let userConfig;
	try {
		userConfig = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
	} catch (e) {
		throw new Error(`bundleCfgPath "${cfgPath}" could not be read. Ensure that it is valid JSON.`);
	}

	const cfgSchemaPath = path.resolve(bundle.dir, 'configschema.json');
	if (!fs.existsSync(cfgSchemaPath)) {
		return userConfig;
	}

	const schema = _parseSchema(bundle.name, cfgSchemaPath);
	const defaultConfig = defaults(schema);
	const validateUserConfig = ajv.compile(schema);
	const userConfigValid = validateUserConfig(userConfig);

	let finalConfig;

	// If the user's config is currently valid before any defaults from the schema have been added,
	// then ensure that adding the defaults won't suddenly invalidate the schema.
	// Else, if the user's config is currently invalid, then try adding the defaults and check if that makes it valid.
	if (userConfigValid) {
		finalConfig = clone(userConfig);
		for (const key in defaultConfig) {
			/* istanbul ignore if */
			if (!{}.hasOwnProperty.call(defaultConfig, key)) {
				continue;
			}

			const _foo = {};
			_foo[key] = defaultConfig[key];

			const _tempMerged = extend(true, _foo, clone(finalConfig));
			const result = validateUserConfig(_tempMerged);
			if (result) {
				finalConfig = _tempMerged;
			}
		}
	} else {
		finalConfig = extend(true, defaultConfig, userConfig);
	}

	const result = validateUserConfig(finalConfig);
	if (result) {
		return finalConfig;
	}

	throw new Error(`Config for bundle "${bundle.name}" is invalid:\n` +
		`${ajv.errorsText(validateUserConfig.errors)}`);
};

module.exports.parseDefaults = function (bundle) {
	const cfgSchemaPath = path.resolve(bundle.dir, 'configschema.json');
	if (fs.existsSync(cfgSchemaPath)) {
		const schema = _parseSchema(bundle.name, cfgSchemaPath);
		return defaults(schema);
	}

	return {};
};

function _parseSchema(bundleName, schemaPath) {
	try {
		return JSON.parse(fs.readFileSync(schemaPath));
	} catch (e) {
		throw new Error(`configschema.json for bundle "${bundleName}" could not be read. ` +
			'Ensure that it is valid JSON.');
	}
}
