import type {
	ComputedField,
	DerivedHandle,
	ReplicantField,
} from "@nodecg/client";
import { Result } from "effect";
import { use, useEffect, useState } from "react";

type Field<T> = ReplicantField<T> | ComputedField<T> | DerivedHandle<T>;

const inflightGets = new WeakMap<
	object,
	Promise<Result.Result<unknown, unknown>>
>();

export const useField = <T>(field: Field<T>) => {
	const [state, setState] = useState<
		readonly [Field<T>, Result.Result<T, unknown>] | undefined
	>(undefined);
	useEffect(() => {
		const consumedGet = inflightGets.get(field);
		const deleteConsumedGet = () => {
			if (inflightGets.get(field) === consumedGet) {
				inflightGets.delete(field);
			}
		};
		return field.subscribe(
			(value) => {
				deleteConsumedGet();
				setState([field, Result.succeed(value)]);
			},
			(error) => {
				deleteConsumedGet();
				setState([field, Result.fail(error)]);
			},
		);
	}, [field]);

	if (state?.[0] === field) {
		return state[1].pipe(Result.getOrThrow);
	}

	const existingInflight = inflightGets.get(field);
	const inflightGet =
		typeof existingInflight === "undefined"
			? field
					.get()
					.then(Result.succeed)
					.catch((error: unknown) => Result.fail(error))
			: (existingInflight as Promise<Result.Result<T, unknown>>);
	inflightGets.set(field, inflightGet);
	const result = use(inflightGet);
	if (Result.isFailure(result)) {
		inflightGets.delete(field);
		throw result.failure;
	}
	return result.success;
};
