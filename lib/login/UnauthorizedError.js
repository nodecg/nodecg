'use strict';

function UnauthorizedError(code, error) {
	Error.call(this, error.message);
	this.message = error.message;
	this.inner = error;
	this.data = {
		message: this.message,
		code,
		type: 'UnauthorizedError'
	};
}

UnauthorizedError.prototype = Object.create(Error.prototype);
UnauthorizedError.prototype.constructor = UnauthorizedError;

module.exports = UnauthorizedError;
