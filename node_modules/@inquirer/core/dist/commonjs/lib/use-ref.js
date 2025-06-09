"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRef = useRef;
const use_state_js_1 = require("./use-state.js");
function useRef(val) {
    return (0, use_state_js_1.useState)({ current: val })[0];
}
