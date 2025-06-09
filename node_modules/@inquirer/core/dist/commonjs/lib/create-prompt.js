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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrompt = createPrompt;
const readline = __importStar(require("node:readline"));
const node_async_hooks_1 = require("node:async_hooks");
const mute_stream_1 = __importDefault(require("mute-stream"));
const signal_exit_1 = require("signal-exit");
const screen_manager_js_1 = __importDefault(require("./screen-manager.js"));
const promise_polyfill_js_1 = require("./promise-polyfill.js");
const hook_engine_js_1 = require("./hook-engine.js");
const errors_js_1 = require("./errors.js");
function getCallSites() {
    const _prepareStackTrace = Error.prepareStackTrace;
    try {
        let result = [];
        Error.prepareStackTrace = (_, callSites) => {
            const callSitesWithoutCurrent = callSites.slice(1);
            result = callSitesWithoutCurrent;
            return callSitesWithoutCurrent;
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions, unicorn/error-message
        new Error().stack;
        return result;
    }
    finally {
        Error.prepareStackTrace = _prepareStackTrace;
    }
}
function createPrompt(view) {
    const callSites = getCallSites();
    const callerFilename = callSites[1]?.getFileName?.();
    const prompt = (config, context = {}) => {
        // Default `input` to stdin
        const { input = process.stdin, signal } = context;
        const cleanups = new Set();
        // Add mute capabilities to the output
        const output = new mute_stream_1.default();
        output.pipe(context.output ?? process.stdout);
        const rl = readline.createInterface({
            terminal: true,
            input,
            output,
        });
        const screen = new screen_manager_js_1.default(rl);
        const { promise, resolve, reject } = promise_polyfill_js_1.PromisePolyfill.withResolver();
        /** @deprecated pass an AbortSignal in the context options instead. See {@link https://github.com/SBoudrias/Inquirer.js#canceling-prompt} */
        const cancel = () => reject(new errors_js_1.CancelPromptError());
        if (signal) {
            const abort = () => reject(new errors_js_1.AbortPromptError({ cause: signal.reason }));
            if (signal.aborted) {
                abort();
                return Object.assign(promise, { cancel });
            }
            signal.addEventListener('abort', abort);
            cleanups.add(() => signal.removeEventListener('abort', abort));
        }
        cleanups.add((0, signal_exit_1.onExit)((code, signal) => {
            reject(new errors_js_1.ExitPromptError(`User force closed the prompt with ${code} ${signal}`));
        }));
        // Re-renders only happen when the state change; but the readline cursor could change position
        // and that also requires a re-render (and a manual one because we mute the streams).
        // We set the listener after the initial workLoop to avoid a double render if render triggered
        // by a state change sets the cursor to the right position.
        const checkCursorPos = () => screen.checkCursorPos();
        rl.input.on('keypress', checkCursorPos);
        cleanups.add(() => rl.input.removeListener('keypress', checkCursorPos));
        return (0, hook_engine_js_1.withHooks)(rl, (cycle) => {
            // The close event triggers immediately when the user press ctrl+c. SignalExit on the other hand
            // triggers after the process is done (which happens after timeouts are done triggering.)
            // We triggers the hooks cleanup phase on rl `close` so active timeouts can be cleared.
            const hooksCleanup = node_async_hooks_1.AsyncResource.bind(() => hook_engine_js_1.effectScheduler.clearAll());
            rl.on('close', hooksCleanup);
            cleanups.add(() => rl.removeListener('close', hooksCleanup));
            cycle(() => {
                try {
                    const nextView = view(config, (value) => {
                        setImmediate(() => resolve(value));
                    });
                    // Typescript won't allow this, but not all users rely on typescript.
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (nextView === undefined) {
                        throw new Error(`Prompt functions must return a string.\n    at ${callerFilename}`);
                    }
                    const [content, bottomContent] = typeof nextView === 'string' ? [nextView] : nextView;
                    screen.render(content, bottomContent);
                    hook_engine_js_1.effectScheduler.run();
                }
                catch (error) {
                    reject(error);
                }
            });
            return Object.assign(promise
                .then((answer) => {
                hook_engine_js_1.effectScheduler.clearAll();
                return answer;
            }, (error) => {
                hook_engine_js_1.effectScheduler.clearAll();
                throw error;
            })
                // Wait for the promise to settle, then cleanup.
                .finally(() => {
                cleanups.forEach((cleanup) => cleanup());
                screen.done({ clearContent: Boolean(context.clearPromptOnDone) });
                output.end();
            })
                // Once cleanup is done, let the expose promise resolve/reject to the internal one.
                .then(() => promise), { cancel });
        });
    };
    return prompt;
}
