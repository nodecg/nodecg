import NestedError from 'nested-error-stacks';

// TODO: Use `Error#cause`.
export default class CopyFileError extends NestedError {
	constructor(message, nested) {
		super(message, nested);
		Object.assign(this, nested);
		this.name = 'CopyFileError';
	}
}
