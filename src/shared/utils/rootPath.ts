import path from 'path';
import fs from 'fs';

const rootPath = {
	path: findRootPath(__dirname),
};

function findRootPath(dir: string): string {
	const filePath = path.join(dir, 'package.json');
	if (fs.existsSync(filePath)) {
		return path.dirname(filePath);
	}

	const parentDir = path.dirname(dir);
	if (dir === parentDir) {
		return '';
	}

	return findRootPath(parentDir);
}

export default rootPath;
