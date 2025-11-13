import * as Sentry from "@sentry/node";

import type { LoggerInterface } from "../../types/logger-interface";
import { config } from "../config";
import { loggerFactory } from "./logger.server";

export let Logger: new (name: string) => LoggerInterface;
if (config.sentry?.enabled) {
	Logger = loggerFactory(config.logging, Sentry);
} else {
	Logger = loggerFactory(config.logging);
}

export function createLogger(name: string): LoggerInterface {
	return new Logger(name);
}
