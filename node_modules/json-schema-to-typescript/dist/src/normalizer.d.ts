import { LinkedJSONSchema, NormalizedJSONSchema } from './types/JSONSchema';
import { Options } from './';
import { DereferencedPaths } from './resolver';
export declare function normalize(rootSchema: LinkedJSONSchema, dereferencedPaths: DereferencedPaths, filename: string, options: Options): NormalizedJSONSchema;
