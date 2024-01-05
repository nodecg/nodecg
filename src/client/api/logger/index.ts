import * as Sentry from '@sentry/browser';
import { filteredConfig } from '../config';
import loggerFactory from './logger.client';
import type { LoggerInterface } from '../../../types/logger-interface';

export let Logger: new (name: string) => LoggerInterface;
if (filteredConfig.sentry.enabled) {
	Logger = loggerFactory(filteredConfig.logging as any, Sentry);
} else {
	Logger = loggerFactory(filteredConfig.logging as any);
}

export default function (name: string): LoggerInterface {
	return new Logger(name);
}
