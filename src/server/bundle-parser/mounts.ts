// Ours
import { NodeCG } from '../../types/nodecg';

export default function(manifest: Pick<NodeCG.Manifest, 'mount' | 'name'>): NodeCG.Bundle.Mount[] {
	const mounts: NodeCG.Bundle.Mount[] = [];

	// Return early if no mounts
	if (typeof manifest.mount === 'undefined' || manifest.mount.length <= 0) {
		return mounts;
	}

	if (!Array.isArray(manifest.mount)) {
		throw new Error(
			`${manifest.name} has an invalid "nodecg.mount" property in its package.json, it must be an array`,
		);
	}

	manifest.mount.forEach((mount, index) => {
		const missingProps = [];
		// Check for missing properties
		if (typeof mount.directory === 'undefined') {
			missingProps.push('directory');
		}

		if (typeof mount.endpoint === 'undefined') {
			missingProps.push('endpoint');
		}

		if (missingProps.length > 0) {
			throw new Error(
				`Mount #${index} could not be parsed as it is missing the following properties: ` +
					`${missingProps.join(', ')}`,
			);
		}

		// Remove trailing slashes from endpoint
		if (mount.endpoint.endsWith('/')) {
			mount.endpoint = mount.endpoint.slice(0, -1);
		}

		mounts.push(mount);
	});

	return mounts;
}
