// Ours
import '../../src/client/types/augment-window';
import { NodeCGAPIClient } from '../../src/client/api/api.client';

declare global {
	interface Window {
		__coverage__: { [k: string]: any };
		dashboardApi: NodeCGAPIClient;
		graphicApi: NodeCGAPIClient;
		singleInstanceApi: NodeCGAPIClient;
	}
}
