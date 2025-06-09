import { extractRequestData as extractRequestData$1, addRequestDataToEvent } from '@sentry/utils';

/**
 * @deprecated `Handlers.ExpressRequest` is deprecated and will be removed in v8. Use `PolymorphicRequest` instead.
 */

/**
 * Normalizes data from the request object, accounting for framework differences.
 *
 * @deprecated `Handlers.extractRequestData` is deprecated and will be removed in v8. Use `extractRequestData` instead.
 *
 * @param req The request object from which to extract data
 * @param keys An optional array of keys to include in the normalized data.
 * @returns An object containing normalized request data
 */
function extractRequestData(req, keys) {
  return extractRequestData$1(req, { include: keys });
}

/**
 * Options deciding what parts of the request to use when enhancing an event
 *
 * @deprecated `Handlers.ParseRequestOptions` is deprecated and will be removed in v8. Use
 * `AddRequestDataToEventOptions` in `@sentry/utils` instead.
 */

/**
 * Enriches passed event with request data.
 *
 * @deprecated `Handlers.parseRequest` is deprecated and will be removed in v8. Use `addRequestDataToEvent` instead.
 *
 * @param event Will be mutated and enriched with req data
 * @param req Request object
 * @param options object containing flags to enable functionality
 * @hidden
 */
function parseRequest(event, req, options = {}) {
  return addRequestDataToEvent(event, req, { include: options });
}

export { extractRequestData, parseRequest };
//# sourceMappingURL=requestDataDeprecated.js.map
