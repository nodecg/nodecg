"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimize = void 0;
const lodash_1 = require("lodash");
const generator_1 = require("./generator");
const AST_1 = require("./types/AST");
const utils_1 = require("./utils");
function optimize(ast, options, processed = new Set()) {
    if (processed.has(ast)) {
        return ast;
    }
    processed.add(ast);
    switch (ast.type) {
        case 'ARRAY':
            return Object.assign(ast, {
                params: optimize(ast.params, options, processed),
            });
        case 'INTERFACE':
            return Object.assign(ast, {
                params: ast.params.map(_ => Object.assign(_, { ast: optimize(_.ast, options, processed) })),
            });
        case 'INTERSECTION':
        case 'UNION':
            // Start with the leaves...
            const optimizedAST = Object.assign(ast, {
                params: ast.params.map(_ => optimize(_, options, processed)),
            });
            // [A, B, C, Any] -> Any
            if (optimizedAST.params.some(_ => _.type === 'ANY')) {
                (0, utils_1.log)('cyan', 'optimizer', '[A, B, C, Any] -> Any', optimizedAST);
                return AST_1.T_ANY;
            }
            // [A, B, C, Unknown] -> Unknown
            if (optimizedAST.params.some(_ => _.type === 'UNKNOWN')) {
                (0, utils_1.log)('cyan', 'optimizer', '[A, B, C, Unknown] -> Unknown', optimizedAST);
                return AST_1.T_UNKNOWN;
            }
            // [A (named), A] -> [A (named)]
            if (optimizedAST.params.every(_ => {
                const a = (0, generator_1.generateType)(omitStandaloneName(_), options);
                const b = (0, generator_1.generateType)(omitStandaloneName(optimizedAST.params[0]), options);
                return a === b;
            }) &&
                optimizedAST.params.some(_ => _.standaloneName !== undefined)) {
                (0, utils_1.log)('cyan', 'optimizer', '[A (named), A] -> [A (named)]', optimizedAST);
                optimizedAST.params = optimizedAST.params.filter(_ => _.standaloneName !== undefined);
            }
            // [A, B, B] -> [A, B]
            const params = (0, lodash_1.uniqBy)(optimizedAST.params, _ => (0, generator_1.generateType)(_, options));
            if (params.length !== optimizedAST.params.length) {
                (0, utils_1.log)('cyan', 'optimizer', '[A, B, B] -> [A, B]', optimizedAST);
                optimizedAST.params = params;
            }
            return Object.assign(optimizedAST, {
                params: optimizedAST.params.map(_ => optimize(_, options, processed)),
            });
        default:
            return ast;
    }
}
exports.optimize = optimize;
// TODO: More clearly disambiguate standalone names vs. aliased names instead.
function omitStandaloneName(ast) {
    switch (ast.type) {
        case 'ENUM':
            return ast;
        default:
            return Object.assign(Object.assign({}, ast), { standaloneName: undefined });
    }
}
//# sourceMappingURL=optimizer.js.map