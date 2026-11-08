import { Option } from "effect";

type Characters<
	S extends string,
	Found extends string = never,
> = S extends `${infer C}${infer Rest}`
	? Characters<Rest, Found | C>
	: S extends ""
		? Found
		: string;

type FileSafeCharacter =
	Characters<"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-">;

// https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file
type WindowsDeviceName =
	| "con"
	| "prn"
	| "aux"
	| "nul"
	| `com${Characters<"123456789">}`
	| `lpt${Characters<"123456789">}`;

type IsFileSafeName<S extends string> = S extends ""
	? false
	: Lowercase<S> extends WindowsDeviceName
		? false
		: [Characters<S>] extends [FileSafeCharacter]
			? true
			: false;

type FileSafeNameRule =
	'Use only A-Z, a-z, 0-9, "_" and "-", and not a Windows device name';

export type FileSafeName<S extends string> =
	IsFileSafeName<S> extends true ? S : FileSafeNameRule;

export type UnsafeNameKeys<T> = {
	[K in keyof T as K extends string
		? IsFileSafeName<K> extends true
			? never
			: K
		: never]: FileSafeNameRule;
};

type CaseClashRule = "Differs from another name only in case";

export type CaseClashingKeys<T, Existing extends string = never> = {
	[K in keyof T as K extends string
		? Lowercase<K> extends Lowercase<Exclude<(keyof T & string) | Existing, K>>
			? K
			: never
		: never]: CaseClashRule;
};

export const isFileSafeName = (name: string) =>
	/^[A-Za-z0-9_-]+$/.test(name) &&
	!/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name);

export const findCaseClash = (
	names: Iterable<string>,
	existing: Iterable<string>,
) => {
	const byLowercase = new Map<string, string>();
	for (const name of existing) {
		byLowercase.set(name.toLowerCase(), name);
	}
	for (const name of names) {
		const clash = byLowercase.get(name.toLowerCase());
		if (typeof clash !== "undefined" && clash !== name) {
			return Option.some({ name, clash });
		}
		byLowercase.set(name.toLowerCase(), name);
	}
	return Option.none();
};
