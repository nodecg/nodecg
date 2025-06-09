#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const ignore_1 = __importDefault(require("ignore"));
const fs_1 = require("fs");
const path_1 = require("path");
const arg_1 = __importDefault(require("arg"));
// Extract `onchange` args and command args after `--`.
const [argv, command] = getArgs(process.argv.slice(2));
const args = arg_1.default({
    "--add": Boolean,
    "--await-write-finish": Number,
    "--cwd": String,
    "--delay": Number,
    "--exclude-path": String,
    "--exclude": [String],
    "--filter": [String],
    "--help": Boolean,
    "--initial": Boolean,
    "--jobs": Number,
    "--kill-signal": String,
    "--kill": Boolean,
    "--no-exclude": Boolean,
    "--outpipe": String,
    "--poll": Number,
    "--verbose": Boolean,
    "-a": "--add",
    "-c": "--cwd",
    "-d": "--delay",
    "-e": "--exclude",
    "-f": "--filter",
    "-h": "--help",
    "-i": "--initial",
    "-j": "--jobs",
    "-k": "--kill",
    "-o": "--outpipe",
    "-p": "--poll",
    "-v": "--verbose",
}, {
    argv,
});
const { _: matches, "--add": add, "--await-write-finish": awaitWriteFinish, "--cwd": cwd = process.cwd(), "--delay": delay, "--exclude-path": excludePath, "--filter": filter, "--help": help, "--initial": initial, "--jobs": jobs, "--kill-signal": killSignal, "--kill": kill, "--outpipe": outpipe, "--poll": poll, "--verbose": verbose, } = args;
const exclude = getExclude(cwd, args["--exclude"], args["--exclude-path"]);
const defaultExclude = !args["--no-exclude"];
// Print usage info
if (!args._.length || help) {
    console.log("Usage: onchange [...file] -- <command> [...args]");
    process.exit();
}
// Validate command or outpipe is specified.
if (!command.length && !outpipe) {
    console.error('Remember to pass the command after "--":');
    console.error("  onchange '**/*.js' -- echo '{{changed}}'");
    process.exit(1);
}
// Validate kill signal.
if (killSignal !== undefined &&
    killSignal !== "SIGINT" &&
    killSignal !== "SIGKILL") {
    console.error('Kill signal must be one of "SIGINT", "SIGKILL".');
    process.exit(1);
}
// Start watcher.
_1.onchange({
    add,
    awaitWriteFinish,
    command,
    cwd,
    defaultExclude,
    delay,
    exclude,
    filter,
    initial,
    jobs,
    kill,
    killSignal,
    matches,
    outpipe,
    poll,
    verbose,
});
function getExclude(cwd, exclude, excludePath) {
    if (!excludePath)
        return exclude || [];
    const excludeFn = getExcludeFunction(cwd, excludePath);
    if (exclude)
        return [...exclude, excludeFn];
    return [excludeFn];
}
/**
 * Build an exclude function from path.
 */
function getExcludeFunction(cwd, excludePath) {
    if (isFileSync(excludePath)) {
        const ignorer = ignore_1.default();
        ignorer.add(fs_1.readFileSync(excludePath, "utf8"));
        return function (path) {
            const relPath = path_1.relative(cwd, path);
            return relPath ? ignorer.ignores(relPath) : false;
        };
    }
    console.error("Unable to load file from `--exclude-path`:");
    console.error("  " + path_1.resolve(excludePath));
    process.exit(1);
}
/**
 * Check if a file exists.
 */
function isFileSync(path) {
    try {
        return fs_1.statSync(path).isFile();
    }
    catch (e) {
        return false;
    }
}
/**
 * Get program args from `argv`.
 */
function getArgs(args) {
    const index = args.indexOf("--");
    if (index)
        return [args.slice(0, index), args.slice(index + 1)];
    return [args, []];
}
//# sourceMappingURL=bin.js.map