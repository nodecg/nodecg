import { Options } from '.';
import { AST } from './types/AST';
export declare function optimize(ast: AST, options: Options, processed?: Set<AST>): AST;
