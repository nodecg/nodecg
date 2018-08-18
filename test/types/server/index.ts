import {NodeCGServer} from '../../../types/lib/nodecg-instance';

export = (nodecg: NodeCGServer) => {
	new nodecg.Logger('foo');
	nodecg.Replicant<string>('stringRep').value;
	nodecg.listenFor('execSomethin', data => {
		console.log('doin somethin');
	});
};
