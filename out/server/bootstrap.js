"use strict";
/**
 * This file is used to automatically bootstrap a NodeCG Server instance.
 * It exports nothing and offers no controls.
 *
 * At this time, other means of starting NodeCG are not officially supported,
 * but they are used internally by our tests.
 *
 * Tests directly instantiate the NodeCGServer class, so that they may have full control
 * over its lifecycle and when the process exits.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const internal_util_1 = require("@nodecg/internal-util");
if (internal_util_1.isLegacyProject) {
    const cwd = process.cwd();
    if (cwd !== internal_util_1.rootPath) {
        console.warn(`[nodecg] process.cwd is ${cwd}, expected ${internal_util_1.rootPath}`);
        process.chdir(internal_util_1.rootPath);
        console.info(`[nodecg] Changed process.cwd to ${internal_util_1.rootPath}`);
    }
}
const config_1 = require("./config");
const server_1 = require("./server");
const exit_hook_1 = require("./util/exit-hook");
const exit_hook_2 = require("./util/exit-hook");
const nodecg_package_json_1 = require("./util/nodecg-package-json");
process.title = `NodeCG - ${nodecg_package_json_1.nodecgPackageJson.version}`;
process.on("uncaughtException", (err) => {
    if (!config_1.sentryEnabled) {
        if (config_1.exitOnUncaught) {
            console.error("UNCAUGHT EXCEPTION! NodeCG will now exit.");
        }
        else {
            console.error("UNCAUGHT EXCEPTION!");
        }
        console.error(err);
        if (config_1.exitOnUncaught) {
            (0, exit_hook_2.gracefulExit)(1);
        }
    }
});
process.on("unhandledRejection", (err) => {
    if (!config_1.sentryEnabled) {
        console.error("UNHANDLED PROMISE REJECTION!");
        console.error(err);
    }
});
const server = new server_1.NodeCGServer();
server.on("error", () => {
    (0, exit_hook_2.gracefulExit)(1);
});
server.on("stopped", () => {
    if (!process.exitCode) {
        (0, exit_hook_2.gracefulExit)(0);
    }
});
server.start().catch((error) => {
    console.error(error);
    process.nextTick(() => {
        (0, exit_hook_2.gracefulExit)(1);
    });
});
(0, exit_hook_1.asyncExitHook)(async () => {
    await server.stop();
}, {
    minimumWait: 100,
});
//# sourceMappingURL=bootstrap.js.map