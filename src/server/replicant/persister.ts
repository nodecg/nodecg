import * as fs from 'node:fs';
import * as path from 'node:path';
import { NODECG_ROOT } from '../nodecg-root';

const replicantsDir = path.join(NODECG_ROOT, 'db', 'replicants');

export class ReplicantPersister {
	value = '';

	readonly #filePath = path.join(
		replicantsDir,
		encodeURIComponent(this.namespace),
		`${encodeURIComponent(this.name)}.json`,
	);

	readonly dirReady = fs.promises.mkdir(path.dirname(this.#filePath), { recursive: true });

	constructor(
		readonly namespace: string,
		readonly name: string,
	) {}

	async save() {
		await this.dirReady;
		await fs.promises.writeFile(this.#filePath, this.value, 'utf-8');
	}
}

// This is inteiionally not async, as it's only called on startup.
export const getAllPeristedReplicants = () => {
	const persisters: ReplicantPersister[] = [];

	const namespaces = fs.readdirSync(replicantsDir, { withFileTypes: true });
	for (const namespace of namespaces) {
		if (!namespace.isDirectory()) {
			continue;
		}
		const replicantNames = fs.readdirSync(path.join(replicantsDir, namespace.name), { withFileTypes: true });
		for (const replicantName of replicantNames) {
			if (!replicantName.isFile()) {
				continue;
			}
			const persister = new ReplicantPersister(
				decodeURIComponent(namespace.name),
				decodeURIComponent(replicantName.name.replace(/\.json$/, '')),
			);
			persister.value = fs.readFileSync(path.join(replicantsDir, namespace.name, replicantName.name), {
				encoding: 'utf-8',
			});
			persisters.push(persister);
		}
	}

	return persisters;
};
