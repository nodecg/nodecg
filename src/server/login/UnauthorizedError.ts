import type { UnAuthErrCode } from '../../types/socket-protocol';

export default class UnauthorizedError extends Error {
	serialized: {
		message: string;
		code: UnAuthErrCode;
		type: 'UnauthorizedError';
	};

	constructor(code: UnAuthErrCode, message: string) {
		super(message);
		this.message = message;
		this.serialized = {
			message: this.message,
			code,
			type: 'UnauthorizedError',
		};
	}
}
