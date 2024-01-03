import { nodecgRootPath } from '../shared/utils/rootPath';

/**
 * The path to have bundles, cfg, db, and assets folder. Used by tests.
 */
export const NODECG_ROOT = process.env['NODECG_ROOT'] ?? nodecgRootPath;
