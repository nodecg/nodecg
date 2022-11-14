declare module 'sha1-file' {
	type ErrorCb = (error: Error) => void;
	type SumCb = (error: undefined, sum: string) => void;
	type Callback = ErrorCb | SumCb;

	function sha1File(filepath: string, callback: Callback): void;
	function sha1File(filepath: string): string;
	export = sha1File;
}
