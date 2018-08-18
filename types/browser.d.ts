import {NodeCGStaticBrowser} from './lib/nodecg-static';
import {NodeCGBrowser} from './lib/nodecg-instance';

declare const nodecg: NodeCGBrowser;
declare const NodeCG: NodeCGStaticBrowser;

export {nodecg, NodeCG}
export * from './lib/config';
export * from './lib/logger';
export * from './lib/replicant';
