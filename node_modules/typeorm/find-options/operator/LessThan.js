"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessThan = LessThan;
const FindOperator_1 = require("../FindOperator");
/**
 * Find Options Operator.
 * Example: { someField: LessThan(10) }
 */
function LessThan(value) {
    return new FindOperator_1.FindOperator("lessThan", value);
}

//# sourceMappingURL=LessThan.js.map
