"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGit = parseGit;
const git = __importStar(require("git-rev-sync"));
function parseGit(bundleDir) {
    const workingDir = process.cwd();
    let retValue;
    try {
        // These will error if bundleDir is not a git repo
        const branch = git.branch(bundleDir);
        const hash = git.long(bundleDir);
        const shortHash = git.short(bundleDir);
        try {
            // Needed for the below commands to work.
            process.chdir(bundleDir);
            // These will error if bundleDir is not a git repo and if `git` is not in $PATH.
            const date = git.date().toISOString();
            const message = git.message();
            retValue = { branch, hash, shortHash, date, message };
        }
        catch {
            retValue = {
                branch,
                hash,
                shortHash,
            };
        }
    }
    catch {
        //
    }
    process.chdir(workingDir);
    return retValue;
}
//# sourceMappingURL=git.js.map