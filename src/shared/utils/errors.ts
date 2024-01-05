/**
 * Make a string out of an error (or other equivalents),
 * including any additional data such as stack trace if available.
 * Safe to use on unknown inputs.
 */
export function stringifyError(error: unknown, noStack = false): string {
	const o = stringifyErrorInner(error);
	if (noStack || !o.stack) {
		return o.message;
	}

	return `${o.message}, ${o.stack}`;
}

export function stringifyErrorInner(error: unknown): {
	message: string;
	stack: string | undefined;
} {
	let message: string | undefined;
	let stack: string | undefined;
	if (typeof error === 'string') {
		message = error;
	} else if (error === null) {
		message = 'null';
	} else if (error === undefined) {
		message = 'undefined';
	} else if (error && typeof error === 'object') {
		if (typeof (error as any).error === 'object' && (error as any).error.message) {
			message = (error as any).error.message;
			stack = (error as any).error.stack;
		} else if ((error as any).reason) {
			if ((error as any).reason.message) {
				message = (error as any).reason.message;
				stack = (error as any).reason.stack || (error as any).reason.reason;
			} else {
				// Is a Meteor.Error
				message = (error as any).reason;
				stack = (error as Error).stack;
			}
		} else if ((error as Error).message) {
			// Is an Error
			message = (error as Error).message;
			stack = (error as Error).stack;
		} else if ((error as any).details) {
			message = (error as any).details;
		} else {
			try {
				// Try to stringify the object:
				message = JSON.stringify(error);
			} catch (e: unknown) {
				// eslint-disable-next-line @typescript-eslint/no-base-to-string,@typescript-eslint/restrict-template-expressions
				message = `${error} (stringifyError: ${e})`;
			}
		}
	} else {
		// eslint-disable-next-line @typescript-eslint/no-base-to-string,@typescript-eslint/restrict-template-expressions
		message = `${error}`;
	}

	message = `${message}`;

	return {
		message,
		stack,
	};
}
