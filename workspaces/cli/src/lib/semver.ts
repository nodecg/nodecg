import semver from "semver";

export const maxSatisfying = (
	versions: ReadonlyArray<string>,
	range: string,
): string | undefined => {
	return semver.maxSatisfying(versions, range) ?? undefined;
};

export const coerce = (version: string): semver.SemVer | undefined => {
	return semver.coerce(version) ?? undefined;
};

export const eq = (v1: string, v2: string): boolean => {
	return semver.eq(v1, v2);
};

export const lt = (v1: string, v2: string): boolean => {
	return semver.lt(v1, v2);
};

export const gte = (v1: string, v2: string): boolean => {
	return semver.gte(v1, v2);
};
