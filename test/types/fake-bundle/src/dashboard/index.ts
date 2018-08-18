import {nodecg, NodeCG} from '../../../../../types/browser';

console.log(nodecg);
console.log(NodeCG);

const logger = new nodecg.Logger('foo');
nodecg.Logger.globalReconfigure({
	file: {enabled: false, level: 'trace', path: './foobar'},
});
logger.error('shaking my smh');
nodecg.log.trace('some verbose logs here');

nodecg.sendMessage('hello!').then(() => {
	console.log('done');
});

const sound = nodecg.playSound('playRocknRoll')
console.log(sound.duration)
