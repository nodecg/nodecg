// Export Effect-based API
export { findNodeJsProject, NotInNodeJsProjectError as ProjectNotFoundError } from "./find-project.ts";
export { detectProjectType } from "./project-type.ts";
export {
	computeRootPaths,
	computeRootPathsCached,
	getRuntimeRoot,
	type RootPaths,
} from "./root-paths.ts";
