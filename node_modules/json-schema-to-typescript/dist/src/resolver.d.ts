import { ParserOptions as $RefOptions } from '@apidevtools/json-schema-ref-parser';
import { JSONSchema } from './types/JSONSchema';
export type DereferencedPaths = WeakMap<JSONSchema, string>;
export declare function dereference(schema: JSONSchema, { cwd, $refOptions }: {
    cwd: string;
    $refOptions: $RefOptions;
}): Promise<{
    dereferencedPaths: DereferencedPaths;
    dereferencedSchema: JSONSchema;
}>;
