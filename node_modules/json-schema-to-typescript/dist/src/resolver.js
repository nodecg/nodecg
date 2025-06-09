"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dereference = void 0;
const json_schema_ref_parser_1 = require("@apidevtools/json-schema-ref-parser");
const utils_1 = require("./utils");
function dereference(schema_1, _a) {
    return __awaiter(this, arguments, void 0, function* (schema, { cwd, $refOptions }) {
        (0, utils_1.log)('green', 'dereferencer', 'Dereferencing input schema:', cwd, schema);
        const parser = new json_schema_ref_parser_1.$RefParser();
        const dereferencedPaths = new WeakMap();
        const dereferencedSchema = (yield parser.dereference(cwd, schema, Object.assign(Object.assign({}, $refOptions), { dereference: Object.assign(Object.assign({}, $refOptions.dereference), { onDereference($ref, schema) {
                    dereferencedPaths.set(schema, $ref);
                } }) }))); // TODO: fix types
        return { dereferencedPaths, dereferencedSchema };
    });
}
exports.dereference = dereference;
//# sourceMappingURL=resolver.js.map