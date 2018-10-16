import {NodeCGStaticBrowser} from './lib/nodecg-static';
import {NodeCGBrowser} from './lib/nodecg-instance';

declare global {
	export const nodecg: NodeCGBrowser;
	export const NodeCG: NodeCGStaticBrowser;
}

export * from './lib/config';
export * from './lib/logger';
export * from './lib/replicant';
