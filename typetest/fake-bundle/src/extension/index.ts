import type NodeCG from '../../../../generated-types';
import { assertNever, assertTypeOrUndefined } from '../shared/utils';

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

	nodecg.on('login', (user) => {
		console.log(user.id, user.name);
	});

	nodecg.on('logout', (user) => {
		console.log(user.id, user.name);
	});

	// Even though a generic type is specified, the value could still be
	// undefined because no default was provided and there is no assertion
	// that a default value will come from the schema.
	const explicitlyTypedRep: NodeCG.ServerReplicant<string> = nodecg.Replicant('explicitlyTypedRep');
	assertTypeOrUndefined<string>(explicitlyTypedRep.value);

	// This is the same thing as the above test.
	const genericallyTypedRep = nodecg.Replicant<string>('genericallyTypedRep');
	assertTypeOrUndefined<string>(genericallyTypedRep.value);

	// Because a default value is provided, this server-side replicant can never be unexpectedly undefined.
	const defaultValueRep = nodecg.Replicant('defaultValueRep', { defaultValue: 'foo' });
	if (typeof defaultValueRep.value !== 'string') {
		assertNever(defaultValueRep.value);
	}

	// This tests the type that asserts that a default value will be provided by the schema.
	const schemaDefaultRep = nodecg.Replicant(
		'schemaDefaultRep',
	) as unknown as NodeCG.ServerReplicantWithSchemaDefault<string>;
	if (typeof schemaDefaultRep.value !== 'string') {
		assertNever(schemaDefaultRep.value);
	}

	// This tests the default case that a replicant's value should be unknown.
	const unknownRep = nodecg.Replicant('unknownRep');
	// @ts-expect-error
	const fail = 4 + unknownRep.value;

	// @ts-expect-error
	nodecg.Replicant('unsupportedOptions', { madeUp: true });
};
