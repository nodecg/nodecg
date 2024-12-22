import path from "path";

/**
 * Checks if a given path (dirOrFile) is a child of another given path (parent).
 */
export default function isChildOf(parent: string, dirOrFile: string): boolean {
	const relative = path.relative(parent, dirOrFile);
	return (
		Boolean(relative) &&
		!relative.startsWith("..") &&
		!path.isAbsolute(relative)
	);
}
