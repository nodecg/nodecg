"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonContains = JsonContains;
const FindOperator_1 = require("../FindOperator");
/**
 * FindOptions Operator.
 * Example: { someField: JsonContains({...}) }
 */
function JsonContains(value) {
    return new FindOperator_1.FindOperator("jsonContains", value);
}

//# sourceMappingURL=JsonContains.js.map
