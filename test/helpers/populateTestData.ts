let populated = false;
export default async function populateTestData(): Promise<void> {
	if (populated) {
		return;
	}

	populated = true;

	// We need to delay importing this,
	// so that we have time to set up the temp
	// process.env.NODECG_ROOT folder.
	const { getConnection, tables } = await import('../../src/server/database');

	const db = getConnection();
	await db.insert(tables.replicant).values({
		namespace: 'add-manifest-cues',
		name: 'soundCues',
		value: JSON.stringify([
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
		]),
	});

	await db.insert(tables.replicant).values({
		namespace: 'remove-persisted-cues',
		name: 'soundCues',
		value: JSON.stringify([
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
		]),
	});

	await db.insert(tables.replicant).values({
		namespace: 'update-cues',
		name: 'soundCues',
		value: JSON.stringify([
			{
				name: 'updated-cue',
				assignable: true,
				file: null,
				volume: 30,
			},
		]),
	});

	await db.insert(tables.replicant).values([
		{
			namespace: 'test-bundle',
			name: 'client_schemaPersistenceFail',
			value: JSON.stringify({ string: 0 }),
		},
		{
			namespace: 'test-bundle',
			name: 'client_schemaPersistencePass',
			value: JSON.stringify({
				string: 'foo',
				object: { numA: 1 },
			}),
		},
		{
			namespace: 'test-bundle',
			name: 'clientFalseyRead',
			value: JSON.stringify(0),
		},
		{
			namespace: 'test-bundle',
			name: 'clientPersistence',
			value: 'it work good!',
		},
		{
			namespace: 'test-bundle',
			name: 'extensionFalseyRead',
			value: JSON.stringify(0),
		},
		{
			namespace: 'test-bundle',
			name: 'extensionPersistence',
			value: 'it work good!',
		},
		{
			namespace: 'test-bundle',
			name: 'schemaPersistenceFail',
			value: JSON.stringify({ string: 0 }),
		},
		{
			namespace: 'test-bundle',
			name: 'schemaPersistencePass',
			value: JSON.stringify({
				string: 'foo',
				object: { numA: 1 },
			}),
		},
	]);
}
