import { rootPath } from "./util/root-path";

/**
 * The path to have bundles, cfg, db, and assets folder. Used by tests.
 */
export const getNodecgRoot = () => process.env["NODECG_ROOT"] ?? rootPath;
