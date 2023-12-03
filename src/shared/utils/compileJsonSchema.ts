// Packages
import AjvDraft07, { type ValidateFunction, type Options, type ErrorObject } from 'ajv';
import AjvDraft04 from 'ajv-draft-04';
import Ajv2019 from 'ajv/dist/2019';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import defaults from '@nodecg/json-schema-defaults';
import { stringifyError } from '.';

const options: Options = {
	allErrors: true,
	verbose: true,
	strict: undefined,
	strictSchema: true,
	strictNumbers: true,
	strictTypes: true,
	strictTuples: true,
	strictRequired: false,
};

const ajv = {
	draft04: addFormats(new AjvDraft04(options)),
	draft07: addFormats(new AjvDraft07(options)),
	'draft2019-09': addFormats(new Ajv2019(options)),
	'draft2020-12': addFormats(new Ajv2020(options)),
};

export function compileJsonSchema(schema: Record<any, unknown>): ValidateFunction {
	const schemaVersion = extractSchemaVersion(schema);
	if (schemaVersion.includes('draft-04')) {
		return ajv.draft04.compile(schema);
	}

	if (schemaVersion.includes('draft-07')) {
		return ajv.draft07.compile(schema);
	}

	if (schemaVersion.includes('draft/2019-09')) {
		return ajv['draft2019-09'].compile(schema);
	}

	if (schemaVersion.includes('draft/2020-12')) {
		return ajv['draft2020-12'].compile(schema);
	}

	throw new Error(`Unsupported JSON Schema version "${schemaVersion}"`);
}

export function formatJsonSchemaErrors(schema: Record<any, unknown>, errors?: ErrorObject[] | null): string {
	const schemaVersion = extractSchemaVersion(schema);
	if (schemaVersion.includes('draft-04')) {
		return ajv.draft04.errorsText(errors).replace(/^data\//gm, '');
	}

	if (schemaVersion.includes('draft-07')) {
		return ajv.draft07.errorsText(errors).replace(/^data\//gm, '');
	}

	if (schemaVersion.includes('draft/2019-09')) {
		return ajv['draft2019-09'].errorsText(errors).replace(/^data\//gm, '');
	}

	if (schemaVersion.includes('draft/2020-12')) {
		return ajv['draft2020-12'].errorsText(errors).replace(/^data\//gm, '');
	}

	throw new Error(`Unsupported JSON Schema version "${schemaVersion}"`);
}

export function getSchemaDefault(schema: Record<any, unknown>, labelForDebugging: string): unknown {
	try {
		return defaults(schema);
	} catch (error: unknown) {
		throw new Error(
			`Error generating default value(s) for schema "${labelForDebugging}":\n\t${stringifyError(error)}`,
		);
	}
}

function extractSchemaVersion(schema: Record<any, unknown>): string {
	// For backwards compat, we default to draft-04.
	const defaultVersion = 'https://json-schema.org/draft-04/schema';
	const extractedVersion = schema.$schema;
	return typeof extractedVersion === 'string' ? extractedVersion : defaultVersion;
}
