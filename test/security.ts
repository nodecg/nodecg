// Packages
import type { TestFn } from 'ava';
import anyTest from 'ava';

// Ours
import * as server from './helpers/server';

const test = anyTest as TestFn<server.ServerContext>;
server.setup();

import * as C from './helpers/test-constants';

test('prevents directory traversal attacks', async (t) => {
	let response = await fetch(`${C.rootUrl()}bundles/test-bundle/shared/..%5c..%5c../should-be-forbidden.txt`);
	t.is(response.status, 404);

	response = await fetch(`${C.rootUrl()}bundles/test-bundle/custom-mount/..%5c..%5c../should-be-forbidden.txt`);
	t.is(response.status, 404);

	response = await fetch(`${C.rootUrl()}bundles/test-bundle/graphics/..%5c..%5c../should-be-forbidden.txt`);
	t.is(response.status, 404);

	response = await fetch(`${C.rootUrl()}bundles/test-bundle/dashboard/..%5c..%5c../should-be-forbidden.txt`);
	t.is(response.status, 404);

	if (process.platform === 'win32') {
		response = await fetch(`${C.rootUrl()}assets/test-bundle/assets/..%5c..%5c..%5cshould-be-forbidden.txt`);
		t.is(response.status, 404);
	} else {
		response = await fetch(`${C.rootUrl()}assets/test-bundle/assets/..%5c..%5c..%5c/should-be-forbidden.txt`);
		t.is(response.status, 404);
	}
});
