import * as path from "node:path";

import type { ValidateFunction } from "ajv";
import { Effect, pipe } from "effect";
import extend from "extend";
import { klona as clone } from "klona/json";

import {
	compileJsonSchema,
	formatJsonSchemaErrors,
	getSchemaDefault,
	getSchemaDefaultFp,
} from "../../shared/utils/compileJsonSchema";
import { stringifyError } from "../../shared/utils/errors";
import type { NodeCG } from "../../types/nodecg";
import { existsSync } from "../util-fp/fs/exists-sync";
import { readJsonFileSync } from "../util-fp/read-json-file-sync";

const parseSchema =
	(bundleName: string) =>
	(schemaPath: string): Effect.Effect<Record<string, any>, Error> =>
		pipe(
			readJsonFileSync(schemaPath),
			Effect.map((json) => json as Record<string, any>),
			Effect.mapError(() => {
				return new Error(
					`configschema.json for bundle "${bundleName}" could not be read. Ensure that it is valid JSON.`,
				);
			}),
		);

const createConfigschemaPath = (bundleDir: string) =>
	path.join(bundleDir, "configschema.json");

export const parseDefaults =
	(bundleName: string) =>
	(bundleDir: string): Effect.Effect<Record<string, any>, Error> => {
		const schemaPath = createConfigschemaPath(bundleDir);
		return pipe(
			existsSync(schemaPath),
			Effect.flatMap((exists) =>
				exists
					? pipe(
							parseSchema(bundleName)(schemaPath),
							Effect.flatMap((schema) =>
								getSchemaDefaultFp(schema, bundleName),
							),
							Effect.map((defaults) => defaults as Record<string, any>),
						)
					: Effect.succeed({}),
			),
		);
	};

export function parseBundleConfig(
	bundleName: string,
	bundleDir: string,
	userConfig: NodeCG.Bundle.UnknownConfig,
): NodeCG.Bundle.UnknownConfig {
	const cfgSchemaPath = path.resolve(bundleDir, "configschema.json");
	const configExists = Effect.runSync(existsSync(cfgSchemaPath));
	if (!configExists) {
		return userConfig;
	}

	const schema = Effect.runSync(parseSchema(bundleName)(cfgSchemaPath));
	const defaultConfig = getSchemaDefault(
		schema,
		bundleName,
	) as NodeCG.Bundle.UnknownConfig;
	let validateUserConfig: ValidateFunction;
	try {
		validateUserConfig = compileJsonSchema(schema);
	} catch (error: unknown) {
		throw new Error(
			`Error compiling JSON Schema for bundle config "${bundleName}":\n\t${stringifyError(error)}`,
		);
	}

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

			const _tempMerged: Record<string, any> = extend(
				true,
				_foo,
				clone(finalConfig),
			);
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
		`Config for bundle "${bundleName}" is invalid:\n${formatJsonSchemaErrors(schema, validateUserConfig.errors)}`,
	);
}
