import { type ErrorObject, type ValidateFunction } from "ajv";
import * as E from "fp-ts/Either";
export declare function compileJsonSchema(schema: Record<any, unknown>): ValidateFunction;
export declare function formatJsonSchemaErrors(schema: Record<any, unknown>, errors?: ErrorObject[] | null): string;
export declare function getSchemaDefault(schema: Record<any, unknown>, labelForDebugging: string): unknown;
export declare const getSchemaDefaultFp: (schema: Record<any, unknown>, labelForDebugging: string) => E.Either<Error, unknown>;
