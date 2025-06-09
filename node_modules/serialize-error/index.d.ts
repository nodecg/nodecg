import {Primitive, JsonObject} from 'type-fest';

export type ErrorObject = {
	name?: string;
	stack?: string;
	message?: string;
	code?: string;
} & JsonObject;

export interface Options {
	/**
	The maximum depth of properties to preserve when serializing/deserializing.

	@default Number.POSITIVE_INFINITY

	@example
	```
	import {serializeError} from 'serialize-error';

	const error = new Error('🦄');
	error.one = {two: {three: {}}};

	console.log(serializeError(error, {maxDepth: 1}));
	//=> {name: 'Error', message: '…', one: {}}

	console.log(serializeError(error, {maxDepth: 2}));
	//=> {name: 'Error', message: '…', one: { two: {}}}
	```
	*/
	readonly maxDepth?: number;
}

/**
Serialize an `Error` object into a plain object.

Non-error values are passed through.
Custom properties are preserved.
Buffer properties are replaced with `[object Buffer]`.
Circular references are handled.
If the input object has a `.toJSON()` method, then it's called instead of serializing the object's properties.
It's up to `.toJSON()` implementation to handle circular references and enumerability of the properties.

@example
```
import {serializeError} from 'serialize-error';

const error = new Error('🦄');

console.log(error);
//=> [Error: 🦄]

console.log(serializeError(error));
//=> {name: 'Error', message: '🦄', stack: 'Error: 🦄\n    at Object.<anonymous> …'}

class ErrorWithDate extends Error {
	constructor() {
		super();
		this.date = new Date();
	}
}
const error = new ErrorWithDate();

console.log(serializeError(error));
//=> {date: '1970-01-01T00:00:00.000Z', name, message, stack}

class ErrorWithToJSON extends Error {
	constructor() {
		super('🦄');
		this.date = new Date();
	}

	toJSON() {
		return serializeError(this);
	}
}
const error = new ErrorWithToJSON();
console.log(serializeError(error));
// => {date: '1970-01-01T00:00:00.000Z', message: '🦄', name, stack}
```
*/
export function serializeError<ErrorType>(error: ErrorType, options?: Options): ErrorType extends Primitive
	? ErrorType
	: ErrorObject;

/**
Deserialize a plain object or any value into an `Error` object.

`Error` objects are passed through.
Non-error values are wrapped in a `NonError` error.
Custom properties are preserved.
Non-enumerable properties are kept non-enumerable (name, message, stack).
Enumerable properties are kept enumerable (all properties besides the non-enumerable ones).
Circular references are handled.

@example
```
import {deserializeError} from 'serialize-error';

const error = deserializeError({
	message: 'aaa',
	stack: 'at <anonymous>:1:13'
});

console.log(error);
// Error: aaa
// at <anonymous>:1:13
```
*/
export function deserializeError(errorObject: ErrorObject | unknown, options?: Options): Error;
