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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseManifest = void 0;
const path = __importStar(require("node:path"));
const internal_util_1 = require("@nodecg/internal-util");
const IOE = __importStar(require("fp-ts/IOEither"));
const semver_1 = __importDefault(require("semver"));
const parseManifest = (bundlePath) => (packageJson) => {
    if (!packageJson.name) {
        return IOE.left(new Error(`${bundlePath}'s package.json must specify "name".`));
    }
    if (internal_util_1.isLegacyProject) {
        if (!packageJson.nodecg) {
            return IOE.left(new Error(`${packageJson.name}'s package.json lacks a "nodecg" property, and therefore cannot be parsed.`));
        }
        if (!semver_1.default.validRange(packageJson.nodecg.compatibleRange)) {
            return IOE.left(new Error(`${packageJson.name}'s package.json does not have a valid "nodecg.compatibleRange" property.`));
        }
        const bundleFolderName = path.basename(bundlePath);
        if (bundleFolderName !== packageJson.name) {
            return IOE.left(new Error(`${packageJson.name}'s folder is named "${bundleFolderName}". Please rename it to "${packageJson.name}".`));
        }
    }
    return IOE.right({
        ...packageJson.nodecg,
        name: packageJson.name,
        version: packageJson.version,
        license: packageJson.license,
        description: packageJson.description,
        homepage: packageJson.homepage,
        author: packageJson.author,
        contributors: packageJson.contributors,
        transformBareModuleSpecifiers: Boolean(packageJson.nodecg?.transformBareModuleSpecifiers),
    });
};
exports.parseManifest = parseManifest;
//# sourceMappingURL=manifest.js.map