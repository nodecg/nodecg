"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.T_UNKNOWN_ADDITIONAL_PROPERTIES = exports.T_UNKNOWN = exports.T_ANY_ADDITIONAL_PROPERTIES = exports.T_ANY = exports.hasStandaloneName = exports.hasComment = void 0;
function hasComment(ast) {
    return (('comment' in ast && ast.comment != null && ast.comment !== '') ||
        // Compare to true because ast.deprecated might be undefined
        ('deprecated' in ast && ast.deprecated === true));
}
exports.hasComment = hasComment;
function hasStandaloneName(ast) {
    return 'standaloneName' in ast && ast.standaloneName != null && ast.standaloneName !== '';
}
exports.hasStandaloneName = hasStandaloneName;
////////////////////////////////////////////     literals
exports.T_ANY = {
    type: 'ANY',
};
exports.T_ANY_ADDITIONAL_PROPERTIES = {
    keyName: '[k: string]',
    type: 'ANY',
};
exports.T_UNKNOWN = {
    type: 'UNKNOWN',
};
exports.T_UNKNOWN_ADDITIONAL_PROPERTIES = {
    keyName: '[k: string]',
    type: 'UNKNOWN',
};
//# sourceMappingURL=AST.js.map