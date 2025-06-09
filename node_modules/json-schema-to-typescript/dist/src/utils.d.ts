import { JSONSchema, LinkedJSONSchema } from './types/JSONSchema';
import { JSONSchema4 } from 'json-schema';
export declare function Try<T>(fn: () => T, err: (e: Error) => any): T;
export declare function traverse(schema: LinkedJSONSchema, callback: (schema: LinkedJSONSchema, key: string | null) => void, processed?: Set<LinkedJSONSchema>, key?: string): void;
/**
 * Eg. `foo/bar/baz.json` => `baz`
 */
export declare function justName(filename?: string): string;
/**
 * Avoid appending "js" to top-level unnamed schemas
 */
export declare function stripExtension(filename: string): string;
/**
 * Convert a string that might contain spaces or special characters to one that
 * can safely be used as a TypeScript interface or enum name.
 */
export declare function toSafeString(string: string): string;
export declare function generateName(from: string, usedNames: Set<string>): string;
export declare function error(...messages: any[]): void;
type LogStyle = 'blue' | 'cyan' | 'green' | 'magenta' | 'red' | 'white' | 'yellow';
export declare function log(style: LogStyle, title: string, ...messages: unknown[]): void;
/**
 * escape block comments in schema descriptions so that they don't unexpectedly close JSDoc comments in generated typescript interfaces
 */
export declare function escapeBlockComment(schema: JSONSchema): void;
export declare function pathTransform(outputPath: string, inputPath: string, filePath: string): string;
/**
 * Removes the schema's `default` property if it doesn't match the schema's `type` property.
 * Useful when parsing unions.
 *
 * Mutates `schema`.
 */
export declare function maybeStripDefault(schema: LinkedJSONSchema): LinkedJSONSchema;
export declare function appendToDescription(existingDescription: string | undefined, ...values: string[]): string;
export declare function isSchemaLike(schema: any): schema is LinkedJSONSchema;
export declare function parseFileAsJSONSchema(filename: string | null, contents: string): JSONSchema4;
export {};
