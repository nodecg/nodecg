'use strict';

module.exports = function (bundle) {
	const mounts = [];

	// Return early if no mounts
	if (typeof bundle.mount === 'undefined' || bundle.mount.length <= 0) {
		return mounts;
	}

	if (!Array.isArray(bundle.mount)) {
		throw new Error(`${bundle.name} has an invalid "nodecg.mount" property in its package.json, ` +
			'it must be an array');
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

		if (missingProps.length > 0) {
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
