"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.And = And;
const FindOperator_1 = require("../FindOperator");
function And(...values) {
    return new FindOperator_1.FindOperator("and", values, true, true);
}

//# sourceMappingURL=And.js.map
