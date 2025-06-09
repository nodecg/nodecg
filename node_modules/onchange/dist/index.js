"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tree_kill_1 = __importDefault(require("tree-kill"));
const path_1 = require("path");
const cross_spawn_1 = require("cross-spawn");
const chokidar_1 = __importDefault(require("chokidar"));
const deque_1 = require("@blakeembrey/deque");
const template_1 = require("@blakeembrey/template");
const ECHO_JS_PATH = path_1.resolve(__dirname, "echo.js");
const ECHO_CMD = `${quote(process.execPath)} ${quote(ECHO_JS_PATH)}`;
/**
 * Execute a "job" on each change event.
 */
class Job {
    constructor(log, command, outpipe) {
        this.log = log;
        this.command = command;
        this.outpipe = outpipe;
    }
    start(cwd, stdin, stdout, stderr, env, onexit) {
        var _a, _b;
        if (this.outpipe) {
            const stdio = [null, stdout, stderr];
            this.log(`executing outpipe "${this.outpipe}"`);
            this.childOutpipe = cross_spawn_1.spawn(this.outpipe, { cwd, env, stdio, shell: true });
            this.childOutpipe.on("exit", (code, signal) => {
                this.log(`outpipe ${exitMessage(code, signal)}`);
                this.childOutpipe = undefined;
                if (!this.childCommand)
                    return onexit();
            });
        }
        if (this.command.length) {
            const stdio = [
                stdin,
                // Use `--outpipe` when specified, otherwise direct to `stdout`.
                this.childOutpipe ? this.childOutpipe.stdin : stdout,
                stderr,
            ];
            this.log(`executing command "${this.command.join(" ")}"`);
            this.childCommand = cross_spawn_1.spawn(this.command[0], this.command.slice(1), {
                cwd,
                env,
                stdio,
            });
            this.childCommand.on("exit", (code, signal) => {
                var _a, _b;
                this.log(`command ${exitMessage(code, signal)}`);
                this.childCommand = undefined;
                if (!this.childOutpipe)
                    return onexit();
                return (_b = (_a = this.childOutpipe) === null || _a === void 0 ? void 0 : _a.stdin) === null || _b === void 0 ? void 0 : _b.end();
            });
        }
        else {
            // No data to write to `outpipe`.
            (_b = (_a = this.childOutpipe) === null || _a === void 0 ? void 0 : _a.stdin) === null || _b === void 0 ? void 0 : _b.end();
        }
    }
    kill(killSignal) {
        if (this.childOutpipe) {
            this.log(`killing outpipe ${this.childOutpipe.pid}`);
            tree_kill_1.default(this.childOutpipe.pid, killSignal);
        }
        if (this.childCommand) {
            this.log(`killing command ${this.childCommand.pid}`);
            tree_kill_1.default(this.childCommand.pid, killSignal);
        }
    }
}
/**
 * Onchange manages
 */
function onchange(options) {
    const { matches } = options;
    const onReady = options.onReady || (() => undefined);
    const initial = !!options.initial;
    const kill = !!options.kill;
    const cwd = options.cwd ? path_1.resolve(options.cwd) : process.cwd();
    const stdin = options.stdin || process.stdin;
    const stdout = options.stdout || process.stdout;
    const stderr = options.stderr || process.stderr;
    const env = options.env || process.env;
    const delay = Math.max(options.delay || 0, 0);
    const jobs = Math.max(options.jobs || 0, 1);
    const killSignal = options.killSignal || "SIGTERM";
    const command = options.command
        ? options.command.map((arg) => template_1.template(arg))
        : [];
    const outpipe = options.outpipe
        ? outpipeTemplate(options.outpipe)
        : undefined;
    const filter = options.filter || [];
    const running = new Set();
    const queue = new deque_1.Deque();
    // Logging.
    const log = options.verbose
        ? function log(message) {
            stdout.write(`onchange: ${message}\n`);
        }
        : function () { };
    // Invalid, nothing to run on change.
    if (command.length === 0 && !outpipe) {
        throw new TypeError('Expected "command" and/or "outpipe" to be specified');
    }
    const ignored = options.exclude || [];
    const ignoreInitial = options.add !== true;
    const usePolling = options.poll !== undefined;
    const interval = options.poll !== undefined ? options.poll : undefined;
    const awaitWriteFinish = options.awaitWriteFinish
        ? { stabilityThreshold: options.awaitWriteFinish }
        : undefined;
    // Add default excludes to the ignore list.
    if (options.defaultExclude !== false) {
        ignored.push("**/node_modules/**", "**/.git/**");
    }
    // Create the "watcher" instance for file system changes.
    const watcher = chokidar_1.default.watch(matches, {
        cwd,
        ignored,
        ignoreInitial,
        usePolling,
        interval,
        awaitWriteFinish,
    });
    /**
     * Try and dequeue the next job to run.
     */
    function dequeue() {
        // Nothing to process.
        if (queue.size === 0)
            return;
        // Too many jobs running already.
        if (running.size >= jobs)
            return;
        // Remove first job from queue (FIFO).
        const job = queue.popLeft();
        // Add job to running set.
        running.add(job);
        // Start the process and remove when finished.
        job.start(cwd, stdin, stdout, stderr, env, () => {
            running.delete(job);
            if (delay > 0)
                return setTimeout(dequeue, delay);
            return dequeue();
        });
    }
    /**
     * Enqueue the next change event to run.
     */
    function enqueue(event, file) {
        const fileExt = path_1.extname(file);
        const state = {
            event,
            changed: file,
            file,
            fileExt,
            fileBase: path_1.basename(file),
            fileBaseNoExt: path_1.basename(file, fileExt),
            fileDir: path_1.dirname(file),
        };
        // Kill all existing tasks on `enqueue`.
        if (kill) {
            queue.clear(); // Remove pending ("killed") tasks.
            running.forEach((child) => child.kill(killSignal)); // Kill running tasks.
        }
        // Log the event and the file affected.
        log(`${file}: ${event}`);
        // Add item to job queue.
        queue.push(new Job(log, command.map((arg) => arg(state)), outpipe === null || outpipe === void 0 ? void 0 : outpipe(state)));
        // Try to immediately run the enqueued job.
        return dequeue();
    }
    // Execute initial event without any changes.
    if (initial)
        enqueue("", "");
    // For any change, creation or deletion, try to run.
    watcher.on("all", (event, file) => {
        if (filter.length && filter.indexOf(event) === -1)
            return;
        return enqueue(event, file);
    });
    // On ready, prepare triggers.
    watcher.on("ready", () => {
        log(`watcher ready`);
        // Notify external listener of "ready" event.
        return onReady();
    });
    watcher.on("error", (error) => log(`watcher error: ${error}`));
    // Return a close function.
    return () => watcher.close();
}
exports.onchange = onchange;
// Template generator for `outpipe` option.
function outpipeTemplate(str) {
    var value = str.trim();
    if (value.charAt(0) === "|" || value.charAt(0) === ">") {
        return template_1.template(`${ECHO_CMD} ${value}`);
    }
    return template_1.template(value);
}
// Simple exit message generator.
function exitMessage(code, signal) {
    return code === null ? `exited with ${signal}` : `completed with ${code}`;
}
/**
 * Quote value for `exec`.
 */
function quote(str) {
    return `"${str.replace(/["\\$`!]/g, "\\$&")}"`;
}
//# sourceMappingURL=index.js.map