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
exports.getSchemaDefaultFp = void 0;
exports.compileJsonSchema = compileJsonSchema;
exports.formatJsonSchemaErrors = formatJsonSchemaErrors;
exports.getSchemaDefault = getSchemaDefault;
const json_schema_defaults_1 = __importDefault(require("@nodecg/json-schema-defaults"));
const ajv_1 = __importDefault(require("ajv"));
const _2019_1 = __importDefault(require("ajv/dist/2019"));
const _2020_1 = __importDefault(require("ajv/dist/2020"));
const ajv_draft_04_1 = __importDefault(require("ajv-draft-04"));
const ajv_formats_1 = __importDefault(require("ajv-formats"));
const E = __importStar(require("fp-ts/Either"));
const errors_1 = require("./errors");
const options = {
    allErrors: true,
    verbose: true,
    strict: "log",
};
const ajv = {
    draft04: (0, ajv_formats_1.default)(new ajv_draft_04_1.default(options)),
    draft07: (0, ajv_formats_1.default)(new ajv_1.default(options)),
    "draft2019-09": (0, ajv_formats_1.default)(new _2019_1.default(options)),
    "draft2020-12": (0, ajv_formats_1.default)(new _2020_1.default(options)),
};
function compileJsonSchema(schema) {
    const schemaVersion = extractSchemaVersion(schema);
    if (schemaVersion.includes("draft-04")) {
        return ajv.draft04.compile(schema);
    }
    if (schemaVersion.includes("draft-07")) {
        return ajv.draft07.compile(schema);
    }
    if (schemaVersion.includes("draft/2019-09")) {
        return ajv["draft2019-09"].compile(schema);
    }
    if (schemaVersion.includes("draft/2020-12")) {
        return ajv["draft2020-12"].compile(schema);
    }
    throw new Error(`Unsupported JSON Schema version "${schemaVersion}"`);
}
function formatJsonSchemaErrors(schema, errors) {
    const schemaVersion = extractSchemaVersion(schema);
    if (schemaVersion.includes("draft-04")) {
        return ajv.draft04.errorsText(errors).replace(/^data\//gm, "");
    }
    if (schemaVersion.includes("draft-07")) {
        return ajv.draft07.errorsText(errors).replace(/^data\//gm, "");
    }
    if (schemaVersion.includes("draft/2019-09")) {
        return ajv["draft2019-09"].errorsText(errors).replace(/^data\//gm, "");
    }
    if (schemaVersion.includes("draft/2020-12")) {
        return ajv["draft2020-12"].errorsText(errors).replace(/^data\//gm, "");
    }
    throw new Error(`Unsupported JSON Schema version "${schemaVersion}"`);
}
function getSchemaDefault(schema, labelForDebugging) {
    try {
        return (0, json_schema_defaults_1.default)(schema);
    }
    catch (error) {
        throw new Error(`Error generating default value(s) for schema "${labelForDebugging}":\n\t${(0, errors_1.stringifyError)(error)}`);
    }
}
const getSchemaDefaultFp = (schema, labelForDebugging) => E.tryCatch(() => (0, json_schema_defaults_1.default)(schema), (error) => new Error(`Error generating default value(s) for schema "${labelForDebugging}":\n\t${(0, errors_1.stringifyError)(error)}`));
exports.getSchemaDefaultFp = getSchemaDefaultFp;
function extractSchemaVersion(schema) {
    // For backwards compat, we default to draft-04.
    const defaultVersion = "https://json-schema.org/draft-04/schema";
    const extractedVersion = schema["$schema"];
    return typeof extractedVersion === "string"
        ? extractedVersion
        : defaultVersion;
}
//# sourceMappingURL=compileJsonSchema.js.map