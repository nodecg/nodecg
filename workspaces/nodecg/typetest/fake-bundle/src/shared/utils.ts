export function assertNever<T extends never>(input: T): void {
	return;
}

export function assertTypeOrUndefined<T>(input: T | undefined): void {
	return;
}
