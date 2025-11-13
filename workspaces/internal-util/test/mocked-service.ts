import { type Context, Data, Layer } from "effect";

export const mockedLayer = <
	T,
	U extends Record<string, any>,
	V extends Partial<U>,
>(
	tag: Context.Tag<T, U>,
	implementation: V,
) =>
	Layer.succeed(
		tag,
		new Proxy<U>({} as U, {
			get: (_target, key) => {
				if (typeof key === "symbol") {
					throw new InvalidKeyError({ key });
				}
				if (key in implementation) {
					return implementation[key];
				}
				throw new NotMockedError({ serviceName: tag.key, methodName: key });
			},
		}),
	);

export class InvalidKeyError extends Data.TaggedError("InvalidKeyError")<{
	key: symbol;
}> {
	override readonly message = `The key ${this.key.toString()} is invalid for mockedService`;
}

export class NotMockedError extends Data.TaggedError("NotMockedError")<{
	serviceName: string;
	methodName: string;
}> {
	override readonly message = `${this.serviceName}'s "${this.methodName}" is not mocked`;
}
