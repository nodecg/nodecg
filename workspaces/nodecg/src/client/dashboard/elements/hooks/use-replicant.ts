import { useCallback, useEffect, useMemo, useState } from "react";
// import { klona as clone } from "klona/json";
import { Jsonify } from "type-fest";

export type UseReplicantOptions<T> = {
	defaultValue?: T;
	bundle?: string;
	persistent?: boolean;
};

/**
 * Subscribe to a replicant, returns tuple of the replicant value and `setValue` function.
 * The component using this function gets re-rendered when the value is updated.
 * The `setValue` function can be used to update replicant value.
 * @param replicantName The name of the replicant to use
 * @param initialValue Initial value to pass to `useState` function
 * @param options Options object. Currently supports the optional `namespace` option
 */
export const useReplicant = <V, T = Jsonify<V>>(
	replicantName: string,
	namespace: string,
	{ defaultValue, persistent }: UseReplicantOptions<T> = {},
) => {
	const replicant = useMemo(() => {
		if (typeof namespace === "string") {
			return NodeCG.Replicant<T>(replicantName, namespace, {
				defaultValue,
				persistent,
			});
		}
		return NodeCG.Replicant<T>(replicantName, namespace, { defaultValue, persistent });
	}, [namespace, defaultValue, persistent, replicantName]);

	const [value, setValue] = useState(replicant.value);

	useEffect(() => {
		const changeHandler = (newValue: T | undefined): void => {
			setValue((oldValue) => {
				if (newValue !== oldValue) {
					return newValue;
				}
				// return clone(newValue);
				return newValue;
			});
		};
		replicant.on("change", changeHandler);
		return () => {
			replicant.removeListener("change", changeHandler);
		};
	}, [replicant]);

	const updateValue = useCallback(
		(newValue: T | ((oldValue?: T) => void)) => {
			if (typeof newValue === "function") {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				(newValue as any)(replicant.value);
			} else {
				replicant.value = newValue;
			}
		},
		[replicant],
	);

	return [value, updateValue] as const;
};
