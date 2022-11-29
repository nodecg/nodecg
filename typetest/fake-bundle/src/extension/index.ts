import type NodeCG from '../../../../generated-types';

type BundleConfig = { foo: { bar: 'bar' } };

export = (nodecg: NodeCG.ServerAPI<BundleConfig>) => {
	new nodecg.Logger('foo');
	nodecg.Replicant<string>('stringRep').value;
	nodecg.listenFor('execSomethin', (_) => {
		console.log('doin somethin');
	});
	console.log(nodecg.bundleConfig.foo.bar);
};
