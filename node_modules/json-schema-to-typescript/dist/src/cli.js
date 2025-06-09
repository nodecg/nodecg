#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const minimist_1 = __importDefault(require("minimist"));
const fs_1 = require("fs");
const tinyglobby_1 = require("tinyglobby");
const is_glob_1 = __importDefault(require("is-glob"));
const path_1 = require("path");
const index_1 = require("./index");
const utils_1 = require("./utils");
main((0, minimist_1.default)(process.argv.slice(2), {
    alias: {
        help: ['h'],
        input: ['i'],
        output: ['o'],
    },
    boolean: [
        'additionalProperties',
        'declareExternallyReferenced',
        'enableConstEnums',
        'format',
        'ignoreMinAndMaxItems',
        'strictIndexSignatures',
        'unknownAny',
        'unreachableDefinitions',
    ],
    default: index_1.DEFAULT_OPTIONS,
    string: ['bannerComment', 'cwd'],
}));
function main(argv) {
    return __awaiter(this, void 0, void 0, function* () {
        if (argv.help) {
            printHelp();
            process.exit(0);
        }
        const argIn = argv._[0] || argv.input;
        const argOut = argv._[1] || argv.output; // the output can be omitted so this can be undefined
        const ISGLOB = (0, is_glob_1.default)(argIn);
        const ISDIR = isDir(argIn);
        if ((ISGLOB || ISDIR) && argOut && argOut.includes('.d.ts')) {
            throw new ReferenceError(`You have specified a single file ${argOut} output for a multi file input ${argIn}. This feature is not yet supported, refer to issue #272 (https://github.com/bcherny/json-schema-to-typescript/issues/272)`);
        }
        try {
            // Process input as either glob, directory, or single file
            if (ISGLOB) {
                yield processGlob(argIn, argOut, argv);
            }
            else if (ISDIR) {
                yield processDir(argIn, argOut, argv);
            }
            else {
                const result = yield processFile(argIn, argv);
                outputResult(result, argOut);
            }
        }
        catch (e) {
            (0, utils_1.error)(e);
            process.exit(1);
        }
    });
}
// check if path is an existing directory
function isDir(path) {
    return (0, fs_1.existsSync)(path) && (0, fs_1.lstatSync)(path).isDirectory();
}
function processGlob(argIn, argOut, argv) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield (0, tinyglobby_1.glob)(argIn, { expandDirectories: false }); // execute glob pattern match
        if (files.length === 0) {
            throw ReferenceError(`You passed a glob pattern "${argIn}", but there are no files that match that pattern in ${process.cwd()}`);
        }
        // we can do this concurrently for perf
        const results = yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
            return [file, yield processFile(file, argv)];
        })));
        // careful to do this serially
        results.forEach(([file, result]) => {
            const outputPath = argOut && `${argOut}/${(0, utils_1.justName)(file)}.d.ts`;
            outputResult(result, outputPath);
        });
    });
}
function processDir(argIn, argOut, argv) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = getPaths(argIn);
        // we can do this concurrently for perf
        const results = yield Promise.all(files.map((file) => __awaiter(this, void 0, void 0, function* () {
            if (!argOut) {
                return [file, yield processFile(file, argv)];
            }
            else {
                const outputPath = (0, utils_1.pathTransform)(argOut, argIn, file);
                return [file, yield processFile(file, argv), outputPath];
            }
        })));
        // careful to do this serially
        results.forEach(([file, result, outputPath]) => outputResult(result, outputPath ? `${outputPath}/${(0, utils_1.justName)(file)}.d.ts` : undefined));
    });
}
function outputResult(result, outputPath) {
    if (!outputPath) {
        process.stdout.write(result);
    }
    else {
        if (!isDir((0, path_1.dirname)(outputPath))) {
            (0, fs_1.mkdirSync)((0, path_1.dirname)(outputPath), { recursive: true });
        }
        return (0, fs_1.writeFileSync)(outputPath, result);
    }
}
function processFile(argIn, argv) {
    return __awaiter(this, void 0, void 0, function* () {
        const { filename, contents } = yield readInput(argIn);
        const schema = (0, utils_1.parseFileAsJSONSchema)(filename, contents);
        return (0, index_1.compile)(schema, argIn, argv);
    });
}
function getPaths(path, paths = []) {
    if ((0, fs_1.existsSync)(path) && (0, fs_1.lstatSync)(path).isDirectory()) {
        (0, fs_1.readdirSync)((0, path_1.resolve)(path)).forEach(item => getPaths((0, path_1.join)(path, item), paths));
    }
    else {
        paths.push(path);
    }
    return paths;
}
function readInput(argIn) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!argIn) {
            return {
                filename: null,
                contents: yield readStream(process.stdin),
            };
        }
        return {
            filename: argIn,
            contents: (0, fs_1.readFileSync)((0, path_1.resolve)(process.cwd(), argIn), 'utf-8'),
        };
    });
}
function readStream(stream) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, stream_1, stream_1_1;
        var _b, e_1, _c, _d;
        const chunks = [];
        try {
            for (_a = true, stream_1 = __asyncValues(stream); stream_1_1 = yield stream_1.next(), _b = stream_1_1.done, !_b; _a = true) {
                _d = stream_1_1.value;
                _a = false;
                const chunk = _d;
                chunks.push(chunk);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_a && !_b && (_c = stream_1.return)) yield _c.call(stream_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return Buffer.concat(chunks).toString('utf8');
    });
}
function printHelp() {
    const pkg = require('../../package.json');
    process.stdout.write(`
${pkg.name} ${pkg.version}
Usage: json2ts [--input, -i] [IN_FILE] [--output, -o] [OUT_FILE] [OPTIONS]

With no IN_FILE, or when IN_FILE is -, read standard input.
With no OUT_FILE and when IN_FILE is specified, create .d.ts file in the same directory.
With no OUT_FILE nor IN_FILE, write to standard output.

You can use any of the following options by adding them at the end.
Boolean values can be set to false using the 'no-' prefix.

  --additionalProperties
      Default value for additionalProperties, when it is not explicitly set
  --cwd=XXX
      Root directory for resolving $ref
  --declareExternallyReferenced
      Declare external schemas referenced via '$ref'?
  --enableConstEnums
      Prepend enums with 'const'?
  --inferStringEnumKeysFromValues
      Create enums from JSON enums instead of union types
  --format
      Format code? Set this to false to improve performance.
  --maxItems
      Maximum number of unioned tuples to emit when representing bounded-size
      array types, before falling back to emitting unbounded arrays. Increase
      this to improve precision of emitted types, decrease it to improve
      performance, or set it to -1 to ignore minItems and maxItems.
  --style.XXX=YYY
      Prettier configuration
  --unknownAny
      Output unknown type instead of any type
  --unreachableDefinitions
      Generates code for definitions that aren't referenced by the schema
`);
}
//# sourceMappingURL=cli.js.map