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
exports.format = void 0;
const prettier_1 = require("prettier");
function format(code, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options.format) {
            return code;
        }
        return (0, prettier_1.format)(code, Object.assign({ parser: 'typescript' }, options.style));
    });
}
exports.format = format;
//# sourceMappingURL=formatter.js.map