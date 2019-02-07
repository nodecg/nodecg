import {NodeCGStaticBrowser} from './lib/nodecg-static';
import {NodeCGBrowser} from './lib/nodecg-instance';

declare global {
	export const nodecg: NodeCGBrowser;
	export const NodeCG: NodeCGStaticBrowser;
	export interface Window { nodecg: NodeCGBrowser, NodeCG: NodeCGStaticBrowser }
}

export {NodeCGStaticBrowser, NodeCGBrowser};
export * from './lib/config';
export * from './lib/logger';
export * from './lib/replicant';
