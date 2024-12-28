import * as Sentry from "@sentry/browser";

import type { LoggerInterface } from "../../../types/logger-interface";
import { filteredConfig } from "../config";
import { loggerFactory } from "./logger.client";

export let Logger: new (name: string) => LoggerInterface;
if (filteredConfig.sentry.enabled) {
	Logger = loggerFactory(filteredConfig.logging as any, Sentry);
} else {
	Logger = loggerFactory(filteredConfig.logging as any);
}

export function createLogger(name: string): LoggerInterface {
	return new Logger(name);
}
