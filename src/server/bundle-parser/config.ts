// Native
import * as path from 'path';
import * as fs from 'fs';

// Packages
import clone from 'clone';
import defaults from 'json-schema-defaults';
import extend from 'extend';
import Ajv from 'ajv';
import type { NodeCG } from '../../types/nodecg';

const ajv = new Ajv({ allErrors: true });

export function parse(
	bundleName: string,
	bundleDir: string,
	userConfig: NodeCG.Bundle.UnknownConfig,
): NodeCG.Bundle.UnknownConfig {
	const cfgSchemaPath = path.resolve(bundleDir, 'configschema.json');
	if (!fs.existsSync(cfgSchemaPath)) {
		return userConfig;
	}

	const schema = _parseSchema(bundleName, cfgSchemaPath);
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

			const _foo: Record<string, any> = {};
			_foo[key] = defaultConfig[key];

			const _tempMerged: Record<string, any> = extend(true, _foo, clone(finalConfig));
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

	throw new Error(
		`Config for bundle "${bundleName}" is invalid:\n${ajv
			.errorsText(validateUserConfig.errors)
			.replace(/^data\//gm, '')}`,
	);
}

export function parseDefaults(bundleName: string, bundleDir: string): Record<string, any> {
	const cfgSchemaPath = path.resolve(bundleDir, 'configschema.json');
	if (fs.existsSync(cfgSchemaPath)) {
		const schema = _parseSchema(bundleName, cfgSchemaPath);
		return defaults(schema);
	}

	return {};
}

function _parseSchema(bundleName: string, schemaPath: string): Record<string, any> {
	try {
		return JSON.parse(fs.readFileSync(schemaPath, { encoding: 'utf8' }));
	} catch (_: unknown) {
		throw new Error(
			`configschema.json for bundle "${bundleName}" could not be read. Ensure that it is valid JSON.`,
		);
	}
}
