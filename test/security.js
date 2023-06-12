'use strict';

// Packages
import test from 'ava';
import * as axios from 'axios';

// Ours
import * as server from './helpers/server';
server.setup();

import * as C from './helpers/test-constants';

test('prevents directory traversal attacks', async t => {
	try {
		await axios.get(
			`${C.rootUrl()}bundles/test-bundle/shared/..%5c..%5c../should-be-forbidden.txt`
		);
	} catch (error) {
		t.is(error.response.status, 404);
	}

	try {
		await axios.get(
			`${C.rootUrl()}bundles/test-bundle/custom-mount/..%5c..%5c../should-be-forbidden.txt`
		);
	} catch (error) {
		t.is(error.response.status, 404);
	}

	try {
		await axios.get(
			`${C.rootUrl()}bundles/test-bundle/graphics/..%5c..%5c../should-be-forbidden.txt`
		);
	} catch (error) {
		t.is(error.response.status, 404);
	}

	try {
		await axios.get(
			`${C.rootUrl()}bundles/test-bundle/dashboard/..%5c..%5c../should-be-forbidden.txt`
		);
	} catch (error) {
		t.is(error.response.status, 404);
	}

	if (process.platform === 'win32') {
		try {
			await axios.get(
				`${C.rootUrl()}assets/test-bundle/assets/..%5c..%5c..%5cshould-be-forbidden.txt`
			);
		} catch (error) {
			t.is(error.response.status, 404);
		}
	} else {
		try {
			await axios.get(
				`${C.rootUrl()}assets/test-bundle/assets/..%5c..%5c..%5c/should-be-forbidden.txt`
			);
		} catch (error) {
			t.is(error.response.status, 404);
		}
	}
});
