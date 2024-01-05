let populated = false;

export default async function populateTestData(): Promise<void> {
	if (populated) {
		return;
	}

	populated = true;

	const { ReplicantPersister } = await import('../../src/server/replicant/persister');

	const populateReplicant = async (namespace: string, name: string, data: unknown) => {
		const persister = new ReplicantPersister(namespace, name);
		persister.value = JSON.stringify(data);
		await persister.save();
	};

	await populateReplicant('add-manifest-cues', 'soundCues', [
		{
			name: 'persisted-cue-1',
			assignable: true,
			file: null,
			volume: 30,
		},
		{
			name: 'persisted-cue-2',
			assignable: true,
			file: null,
			volume: 30,
		},
	]);

	await populateReplicant('remove-persisted-cues', 'soundCues', [
		{
			name: 'persisted-cue-1',
			assignable: true,
			file: null,
			volume: 30,
		},
		{
			name: 'persisted-cue-2',
			assignable: true,
			file: null,
			volume: 30,
		},
	]);

	await populateReplicant('update-cues', 'soundCues', [
		{
			name: 'updated-cue',
			assignable: true,
			file: null,
			volume: 30,
		},
	]);

	await Promise.all([
		populateReplicant('test-bundle', 'client_schemaPersistenceFail', { string: 0 }),
		populateReplicant('test-bundle', 'client_schemaPersistencePass', { string: 'foo', object: { numA: 1 } }),
		populateReplicant('test-bundle', 'clientFalseyRead', 0),
		populateReplicant('test-bundle', 'clientPersistence', 'it work good!'),
		populateReplicant('test-bundle', 'extensionFalseyRead', 0),
		populateReplicant('test-bundle', 'extensionPersistence', 'it work good!'),
		populateReplicant('test-bundle', 'schemaPersistenceFail', { string: 0 }),
		populateReplicant('test-bundle', 'schemaPersistencePass', { string: 'foo', object: { numA: 1 } }),
	]);
}
