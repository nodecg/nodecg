import * as Sentry from "@sentry/browser";
import { filteredConfig } from "../config";
import { loggerFactory } from "./logger.client";
export let Logger;
if (filteredConfig.sentry.enabled) {
    Logger = loggerFactory(filteredConfig.logging, Sentry);
}
else {
    Logger = loggerFactory(filteredConfig.logging);
}
export function createLogger(name) {
    return new Logger(name);
}
//# sourceMappingURL=index.js.map