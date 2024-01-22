import * as fs from 'node:fs';
import * as path from 'node:path';
import { nodecgRootPath } from '../shared/utils/rootPath';

/** Checks if the nodecg package is a parent of the given directory  */
function isNodeCGParent(dir: string): boolean {
	if (dir === nodecgRootPath) return true;

	const parentDir = path.dirname(dir);

	// Check if we've reached the top of the directory tree, otherwise recurse
	return dir === parentDir ? false : isNodeCGParent(parentDir);
}

const cwd = process.cwd();

/** The run mode of this project, and what the nodecg root contains. If module, nodecg is being run as a module */
const RUN_MODE =
	cwd !== nodecgRootPath && fs.existsSync(path.resolve(cwd, 'package.json')) && !isNodeCGParent(cwd)
		? 'module'
		: 'framework';

/**
 * The path to have bundles, cfg, db, and assets folder.
 * process.env.NODECG_ROOT is used by tests.
 */
const NODECG_ROOT = process.env['NODECG_ROOT'] ?? (RUN_MODE === 'module' ? cwd : nodecgRootPath);

export { NODECG_ROOT, RUN_MODE };
