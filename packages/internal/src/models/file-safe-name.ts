import { Option, Schema } from "effect";

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

export const FileSafeName = Schema.NonEmptyString.check(
	Schema.isPattern(/^[A-Za-z0-9_-]+$/),
	Schema.makeFilter((name) =>
		/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name)
			? `"${name}" is a Windows device name`
			: undefined,
	),
);
export type FileSafeName = typeof FileSafeName.Type;

export type ValidateFileSafeName<S extends string> =
	IsFileSafeName<S> extends true ? S : FileSafeNameRule;

export type UnsafeNameKeys<T> = {
	[K in keyof T as K extends string
		? IsFileSafeName<K> extends true
			? never
			: K
		: never]: FileSafeNameRule;
};

type CaseClashRule = "Differs from another name only in case";

export type CaseClashingKeys<T> = {
	[K in keyof T as K extends string
		? Lowercase<K> extends Lowercase<Exclude<keyof T & string, K>>
			? K
			: never
		: never]: CaseClashRule;
};

const isFileSafeNameSchema = Schema.is(FileSafeName);

// Return a plain boolean so a refused name keeps its type in the caller's error message.
export const isFileSafeName = (name: string): boolean =>
	isFileSafeNameSchema(name);

export const findCaseClash = (names: Iterable<string>) => {
	const byLowercase = new Map<string, string>();
	for (const name of names) {
		const clash = byLowercase.get(name.toLowerCase());
		if (typeof clash !== "undefined" && clash !== name) {
			return Option.some({ name, clash });
		}
		byLowercase.set(name.toLowerCase(), name);
	}
	return Option.none();
};
