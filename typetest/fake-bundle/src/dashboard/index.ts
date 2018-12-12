/// <reference path="../../../../types/browser.d.ts" />

import {NodeCGConfig} from '../../../../types/browser';

console.log(nodecg);
console.log(NodeCG);

const logger = new nodecg.Logger('foo');
nodecg.Logger.globalReconfigure({
	file: {enabled: false, level: 'trace', path: './foobar'},
});
logger.error('shaking my smh');
nodecg.log.trace('some verbose logs here');

const rep1 = nodecg.Replicant('rep1');
const rep2 = nodecg.Replicant('rep2');
const rep3 = nodecg.Replicant('rep3');

NodeCG.waitForReplicant(rep1).then(() => {
	console.log('[static] rep1 is fully declared and ready to use!');
});

NodeCG.waitForReplicants(rep2, [rep3]).then(() => {
	console.log('[static] rep2 and rep3 are fully declared and ready to use!');
});

nodecg.waitForReplicant(rep1).then(() => {
	console.log('[instance] rep1 is fully declared and ready to use!');
});

nodecg.waitForReplicants(rep2, [rep3]).then(() => {
	console.log('[instance] rep2 and rep3 are fully declared and ready to use!');
});

nodecg.sendMessage('hello!').then(() => {
	console.log('done');
});

const sound = nodecg.playSound('playRocknRoll');
console.log(sound.duration);

export const config: NodeCGConfig = nodecg.config;
