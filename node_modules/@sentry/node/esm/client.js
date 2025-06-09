import * as os from 'os';
import { TextEncoder } from 'util';
import { ServerRuntimeClient, SDK_VERSION } from '@sentry/core';

/**
 * The Sentry Node SDK Client.
 *
 * @see NodeClientOptions for documentation on configuration options.
 * @see SentryClient for usage documentation.
 */
class NodeClient extends ServerRuntimeClient {
  /**
   * Creates a new Node SDK instance.
   * @param options Configuration options for this SDK.
   */
   constructor(options) {
    options._metadata = options._metadata || {};
    options._metadata.sdk = options._metadata.sdk || {
      name: 'sentry.javascript.node',
      packages: [
        {
          name: 'npm:@sentry/node',
          version: SDK_VERSION,
        },
      ],
      version: SDK_VERSION,
    };

    // Until node supports global TextEncoder in all versions we support, we are forced to pass it from util
    options.transportOptions = {
      textEncoder: new TextEncoder(),
      ...options.transportOptions,
    };

    const clientOptions = {
      ...options,
      platform: 'node',
      runtime: { name: 'node', version: global.process.version },
      serverName: options.serverName || global.process.env.SENTRY_NAME || os.hostname(),
    };

    super(clientOptions);
  }
}

export { NodeClient };
//# sourceMappingURL=client.js.map
