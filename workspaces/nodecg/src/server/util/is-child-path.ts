import path from "path";

/**
 * Checks if a given path (dirOrFile) is a child of another given path (parent).
 */
export function isChildPath(parent: string, dirOrFile: string): boolean {
	if (!path.isAbsolute(parent) || !path.isAbsolute(dirOrFile)) {
		throw new Error("Both paths must be absolute paths");
	}
	const relative = path.relative(parent, dirOrFile);
	return (
		Boolean(relative) &&
		!relative.startsWith("..") &&
		!path.isAbsolute(relative)
	);
}
