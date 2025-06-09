/// <reference types="lodash" />
import { Options } from './index';
import { AST } from './types/AST';
export declare function generate(ast: AST, options?: Options): string;
declare function generateTypeUnmemoized(ast: AST, options: Options): string;
export declare const generateType: typeof generateTypeUnmemoized & import("lodash").MemoizedFunction;
export {};
