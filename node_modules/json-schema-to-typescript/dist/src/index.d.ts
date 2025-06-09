import { JSONSchema4 } from 'json-schema';
import { ParserOptions as $RefOptions } from '@apidevtools/json-schema-ref-parser';
import { Options as PrettierOptions } from 'prettier';
import { JSONSchema as LinkedJSONSchema } from './types/JSONSchema';
export { EnumJSONSchema, JSONSchema, NamedEnumJSONSchema, CustomTypeJSONSchema } from './types/JSONSchema';
export interface Options {
    /**
     * [$RefParser](https://github.com/APIDevTools/json-schema-ref-parser) Options, used when resolving `$ref`s
     */
    $refOptions: $RefOptions;
    /**
     * Default value for additionalProperties, when it is not explicitly set.
     */
    additionalProperties: boolean;
    /**
     * Disclaimer comment prepended to the top of each generated file.
     */
    bannerComment: string;
    /**
     * Custom function to provide a type name for a given schema
     */
    customName?: (schema: LinkedJSONSchema, keyNameFromDefinition: string | undefined) => string | undefined;
    /**
     * Root directory for resolving [`$ref`](https://tools.ietf.org/id/draft-pbryan-zyp-json-ref-03.html)s.
     */
    cwd: string;
    /**
     * Declare external schemas referenced via `$ref`?
     */
    declareExternallyReferenced: boolean;
    /**
     * Prepend enums with [`const`](https://www.typescriptlang.org/docs/handbook/enums.html#computed-and-constant-members)?
     */
    enableConstEnums: boolean;
    /**
     * Create enums from JSON enums with eponymous keys
     */
    inferStringEnumKeysFromValues: boolean;
    /**
     * Format code? Set this to `false` to improve performance.
     */
    format: boolean;
    /**
     * Ignore maxItems and minItems for `array` types, preventing tuples being generated.
     */
    ignoreMinAndMaxItems: boolean;
    /**
     * Maximum number of unioned tuples to emit when representing bounded-size array types,
     * before falling back to emitting unbounded arrays. Increase this to improve precision
     * of emitted types, decrease it to improve performance, or set it to `-1` to ignore
     * `minItems` and `maxItems`.
     */
    maxItems: number;
    /**
     * Append all index signatures with `| undefined` so that they are strictly typed.
     *
     * This is required to be compatible with `strictNullChecks`.
     */
    strictIndexSignatures: boolean;
    /**
     * A [Prettier](https://prettier.io/docs/en/options.html) configuration.
     */
    style: PrettierOptions;
    /**
     * Generate code for `definitions` that aren't referenced by the schema?
     */
    unreachableDefinitions: boolean;
    /**
     * Generate unknown type instead of any
     */
    unknownAny: boolean;
}
export declare const DEFAULT_OPTIONS: Options;
export declare function compileFromFile(filename: string, options?: Partial<Options>): Promise<string>;
export declare function compile(schema: JSONSchema4, name: string, options?: Partial<Options>): Promise<string>;
export declare class ValidationError extends Error {
}
