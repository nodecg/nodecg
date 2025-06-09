import type { EventProcessor, Integration } from '@sentry/types';
export declare enum ChannelName {
    RequestCreate = "undici:request:create",
    RequestEnd = "undici:request:headers",
    RequestError = "undici:request:error"
}
export interface UndiciOptions {
    /**
     * Whether breadcrumbs should be recorded for requests
     * Defaults to true
     */
    breadcrumbs: boolean;
    /**
     * Function determining whether or not to create spans to track outgoing requests to the given URL.
     * By default, spans will be created for all outgoing requests.
     */
    shouldCreateSpanForRequest?: (url: string) => boolean;
}
/**
 * Instruments outgoing HTTP requests made with the `undici` package via
 * Node's `diagnostics_channel` API.
 *
 * Supports Undici 4.7.0 or higher.
 *
 * Requires Node 16.17.0 or higher.
 */
export declare class Undici implements Integration {
    /**
     * @inheritDoc
     */
    static id: string;
    /**
     * @inheritDoc
     */
    name: string;
    private readonly _options;
    private readonly _createSpanUrlMap;
    private readonly _headersUrlMap;
    constructor(_options?: Partial<UndiciOptions>);
    /**
     * @inheritDoc
     */
    setupOnce(_addGlobalEventProcessor: (callback: EventProcessor) => void): void;
    /** Helper that wraps shouldCreateSpanForRequest option */
    private _shouldCreateSpan;
    private _onRequestCreate;
    private _onRequestEnd;
    private _onRequestError;
}
//# sourceMappingURL=index.d.ts.map