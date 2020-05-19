// Native
import * as path from 'path';

// Packages
import * as fs from 'fs-extra';

// Ours
import loadConfig from './loader';

const cfgDirectoryPath = path.join(process.env.NODECG_ROOT, 'cfg');

// Make 'cfg' folder if it doesn't exist
if (!fs.existsSync(cfgDirectoryPath)) {
	fs.mkdirpSync(cfgDirectoryPath);
}

const { config, filteredConfig } = loadConfig(cfgDirectoryPath);
export { config, filteredConfig };
