'use strict';

module.exports = function (bundle) {
	const mounts = [];

	if (!(bundle.mount instanceof Array)) {
		throw new Error(`${bundle.name} has an invalid "nodecg.mount" property in its package.json, ` +
			'it must be an array');
	}

	// Return early if no mounts
	if (bundle.mount.length <= 0) {
		return mounts;
	}

	bundle.mount.forEach((mount, index) => {
		const missingProps = [];
		// Check for missing properties
		if (typeof mount.directory === 'undefined') {
			missingProps.push('directory');
		}

		if (typeof mount.endpoint === 'undefined') {
			missingProps.push('endpoint');
		}

		if (missingProps.length) {
			throw new Error(`Mount #${index} could not be parsed as it is missing the following properties: ` +
				`${missingProps.join(', ')}`);
		}

		// Remove trailing slashes from endpoint
		if (mount.endpoint.endsWith('/')) {
			mount.endpoint = mount.endpoint.slice(0, -1);
		}

		mounts.push(mount);
	});

	return mounts;
};
