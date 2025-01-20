export async function listNpmVersions(packageName: string) {
	const res = await fetch(`https://registry.npmjs.org/${packageName}`);
	if (!res.ok) {
		throw new Error(`Failed to fetch versions for ${packageName}`);
	}
	const data = (await res.json()) as { versions: Record<string, unknown> };
	return Object.keys(data.versions);
}
