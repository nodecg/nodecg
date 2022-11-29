import type NodeCG from '../../../../generated-types';

type BundleConfig = { foo: { bar: 'bar' } };

export = (nodecg: NodeCG.ServerAPI<BundleConfig>) => {
	new nodecg.Logger('foo');
	nodecg.Replicant<string>('stringRep').value;
	nodecg.listenFor('execSomethin', (_) => {
		console.log('doin somethin');
	});
	console.log(nodecg.bundleConfig.foo.bar);

	nodecg.mount((req, _res, _next) => {
		if (req.user) {
			const ident = req.user.identities[0];
			switch (ident.provider_type) {
				case 'discord':
				case 'twitch':
					console.log(ident.provider_access_token, ident.provider_refresh_token);
			}
		}
	});
};
