import {NodeCG} from '../../../../types/server';

export = (nodecg: NodeCG) => {
	new nodecg.Logger('foo');
	nodecg.Replicant<string>('stringRep').value;
	nodecg.listenFor('execSomethin', _ => {
		console.log('doin somethin');
	});
};
