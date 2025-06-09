"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Or = Or;
const FindOperator_1 = require("../FindOperator");
function Or(...values) {
    return new FindOperator_1.FindOperator("or", values, true, true);
}

//# sourceMappingURL=Or.js.map
