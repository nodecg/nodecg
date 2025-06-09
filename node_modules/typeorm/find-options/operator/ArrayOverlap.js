"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayOverlap = ArrayOverlap;
const FindOperator_1 = require("../FindOperator");
/**
 * FindOptions Operator.
 * Example: { someField: ArrayOverlap([...]) }
 */
function ArrayOverlap(value) {
    return new FindOperator_1.FindOperator("arrayOverlap", value);
}

//# sourceMappingURL=ArrayOverlap.js.map
