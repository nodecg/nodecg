/// <reference path="../../../../generated-types/augment-window.d.ts" />
import type NodeCGTypes from '../../../../generated-types';

console.log(nodecg);
console.log(NodeCG);

const logger = new nodecg.Logger('foo');
logger.error('shaking my smh');
nodecg.log.trace('some verbose logs here');

nodecg.sendMessage('hello!').then(() => {
	console.log('done');
});

const sound = nodecg.playSound('playRocknRoll');
console.log(sound.duration);

export const config: NodeCGTypes.FilteredConfig = nodecg.config;
