// Packages
import * as Sentry from '@sentry/browser';

// Ours
import { filteredConfig } from '../config';
import loggerFactory from './logger.client';
import { LoggerInterface } from '../../../shared/logger-interface';

export let Logger: new (name: string) => LoggerInterface;
if (filteredConfig.sentry.enabled) {
	Logger = loggerFactory(filteredConfig.logging as any, Sentry);
} else {
	Logger = loggerFactory(filteredConfig.logging as any);
}

export default function(name: string): LoggerInterface {
	return new Logger(name);
}
