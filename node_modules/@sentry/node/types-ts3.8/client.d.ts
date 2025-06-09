import { ServerRuntimeClient } from '@sentry/core';
import { NodeClientOptions } from './types';
/**
 * The Sentry Node SDK Client.
 *
 * @see NodeClientOptions for documentation on configuration options.
 * @see SentryClient for usage documentation.
 */
export declare class NodeClient extends ServerRuntimeClient<NodeClientOptions> {
    /**
     * Creates a new Node SDK instance.
     * @param options Configuration options for this SDK.
     */
    constructor(options: NodeClientOptions);
}
//# sourceMappingURL=client.d.ts.map
