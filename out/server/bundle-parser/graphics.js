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
exports.parseGraphics = parseGraphics;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function parseGraphics(graphicsDir, manifest) {
    const graphics = [];
    if (fs.existsSync(graphicsDir) && typeof manifest.graphics === "undefined") {
        // If the graphics folder exists but the nodecg.graphics property doesn't, throw an error.
        throw new Error(`${manifest.name} has a "graphics" folder, ` +
            'but no "nodecg.graphics" property was found in its package.json');
    }
    // If nodecg.graphics exists but the graphics folder doesn't, throw an error.
    if (!fs.existsSync(graphicsDir) && typeof manifest.graphics !== "undefined") {
        throw new Error(`${manifest.name} has a "nodecg.graphics" property in its package.json, but no "graphics" folder`);
    }
    // If neither the folder nor the manifest exist, return an empty array.
    if (!fs.existsSync(graphicsDir) && typeof manifest.graphics === "undefined") {
        return graphics;
    }
    if (!manifest.graphics) {
        return graphics;
    }
    manifest.graphics.forEach((graphic, index) => {
        const missingProps = [];
        if (typeof graphic.file === "undefined") {
            missingProps.push("file");
        }
        if (typeof graphic.width === "undefined") {
            missingProps.push("width");
        }
        if (typeof graphic.height === "undefined") {
            missingProps.push("height");
        }
        if (missingProps.length) {
            throw new Error(`Graphic #${index} could not be parsed as it is missing the following properties: ` +
                missingProps.join(", "));
        }
        // Check if this bundle already has a graphic for this file
        const dupeFound = graphics.some((g) => g.file === graphic.file);
        if (dupeFound) {
            throw new Error(`Graphic #${index} (${graphic.file}) has the same file as another graphic in ${manifest.name}`);
        }
        const filePath = path.join(graphicsDir, graphic.file);
        // Check that the panel file exists, throws error if it doesn't
        fs.accessSync(filePath, fs.constants.F_OK | fs.constants.R_OK);
        const parsedGraphic = {
            ...graphic,
            singleInstance: Boolean(graphic.singleInstance),
            url: `/bundles/${manifest.name}/graphics/${graphic.file}`,
        };
        graphics.push(parsedGraphic);
    });
    return graphics;
}
//# sourceMappingURL=graphics.js.map