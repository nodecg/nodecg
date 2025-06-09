import { JSONSchema4Type } from 'json-schema';
import { Options } from './';
import type { AST } from './types/AST';
import type { NormalizedJSONSchema, SchemaType } from './types/JSONSchema';
export type Processed = Map<NormalizedJSONSchema, Map<SchemaType, AST>>;
export type UsedNames = Set<string>;
export declare function parse(schema: NormalizedJSONSchema | JSONSchema4Type, options: Options, keyName?: string, processed?: Processed, usedNames?: Set<string>): AST;
