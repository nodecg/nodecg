import * as fs from 'node:fs';
import * as path from 'node:path';
import { NODECG_ROOT } from '../../src/server/nodecg-root';

export const readReplicantFromFile = async (namespace: string, name: string) => {
	const replicantPath = path.join(
		NODECG_ROOT,
		'db',
		'replicants',
		encodeURIComponent(namespace),
		`${encodeURIComponent(name)}.json`,
	);

	const fileHandle = await fs.promises.open(replicantPath, 'r');
	await fileHandle.datasync(); // Ensure that the file is fully written to disk before reading it
	const data = await fileHandle.readFile('utf-8');
	await fileHandle.close();
	return data;
};
