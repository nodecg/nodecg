"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPortablePath = toPortablePath;
exports.filepathToName = filepathToName;
exports.isAbsolute = isAbsolute;
const StringUtils_1 = require("./StringUtils");
const WINDOWS_PATH_REGEXP = /^([a-zA-Z]:.*)$/;
const UNC_WINDOWS_PATH_REGEXP = /^\\\\(\.\\)?(.*)$/;
function toPortablePath(filepath) {
    if (process.platform !== `win32`)
        return filepath;
    if (filepath.match(WINDOWS_PATH_REGEXP))
        filepath = filepath.replace(WINDOWS_PATH_REGEXP, `/$1`);
    else if (filepath.match(UNC_WINDOWS_PATH_REGEXP))
        filepath = filepath.replace(UNC_WINDOWS_PATH_REGEXP, (match, p1, p2) => `/unc/${p1 ? `.dot/` : ``}${p2}`);
    return filepath.replace(/\\/g, `/`);
}
/**
 * Create deterministic valid database name (class, database) of fixed length from any filepath. Equivalent paths for windows/posix systems should
 * be equivalent to enable portability
 */
function filepathToName(filepath) {
    const uniq = toPortablePath(filepath).toLowerCase();
    return (0, StringUtils_1.hash)(uniq, { length: 63 });
}
/**
 * Cross platform isAbsolute
 */
function isAbsolute(filepath) {
    return !!filepath.match(/^(?:[a-z]:|[\\]|[/])/i);
}

//# sourceMappingURL=PathUtils.js.map
