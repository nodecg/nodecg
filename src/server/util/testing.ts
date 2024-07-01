export function isTesting(): boolean {
	return process.env.NODECG_TEST?.toLowerCase() === 'true';
}
