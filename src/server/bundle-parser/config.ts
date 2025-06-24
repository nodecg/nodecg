import * as path from "node:path";

import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";
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
import { readJsonFileSync } from "../effect/read-json-file";

const parseSchema = (bundleName: string) => (schemaPath: string) =>
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

export const parseDefaults = (bundleName: string) => (bundleDir: string) => {
	const schemaPath = createConfigschemaPath(bundleDir);
	return Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const exists = yield* fs.exists(schemaPath);
		if (exists) {
			const schema = yield* parseSchema(bundleName)(schemaPath);
			const defaults = yield* getSchemaDefaultFp(schema, bundleName);
			return defaults as Record<string, any>;
		}
		return {};
	});
};

export function parseBundleConfig(
	bundleName: string,
	bundleDir: string,
	userConfig: NodeCG.Bundle.UnknownConfig,
): NodeCG.Bundle.UnknownConfig {
	const cfgSchemaPath = path.resolve(bundleDir, "configschema.json");
	const configExists = Effect.runSync(
		pipe(
			Effect.gen(function* () {
				const fs = yield* FileSystem.FileSystem;
				return yield* fs.exists(cfgSchemaPath);
			}),
			Effect.provide(NodeFileSystem.layer),
		),
	);
	if (!configExists) {
		return userConfig;
	}

	const schema = Effect.runSync(
		parseSchema(bundleName)(cfgSchemaPath).pipe(
			Effect.provide(NodeFileSystem.layer),
		),
	);
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
