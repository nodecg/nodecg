// Ours
import '../../src/client/types/augment-window';
import type { NodeCGAPIClient } from '../../src/client/api/api.client';

declare global {
	interface Window {
		__coverage__: Record<string, any>;
		dashboardApi: NodeCGAPIClient;
		graphicApi: NodeCGAPIClient;
		singleInstanceApi: NodeCGAPIClient;
	}
}
