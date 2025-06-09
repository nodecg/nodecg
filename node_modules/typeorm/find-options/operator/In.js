"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.In = In;
const FindOperator_1 = require("../FindOperator");
/**
 * Find Options Operator.
 * Example: { someField: In([...]) }
 */
function In(value) {
    return new FindOperator_1.FindOperator("in", value, true, true);
}

//# sourceMappingURL=In.js.map
