import { baggageHeaderToDynamicSamplingContext } from './baggage.js';
import { uuid4 } from './misc.js';

const TRACEPARENT_REGEXP = new RegExp(
  '^[ \\t]*' + // whitespace
    '([0-9a-f]{32})?' + // trace_id
    '-?([0-9a-f]{16})?' + // span_id
    '-?([01])?' + // sampled
    '[ \\t]*$', // whitespace
);

/**
 * Extract transaction context data from a `sentry-trace` header.
 *
 * @param traceparent Traceparent string
 *
 * @returns Object containing data from the header, or undefined if traceparent string is malformed
 */
function extractTraceparentData(traceparent) {
  if (!traceparent) {
    return undefined;
  }

  const matches = traceparent.match(TRACEPARENT_REGEXP);
  if (!matches) {
    return undefined;
  }

  let parentSampled;
  if (matches[3] === '1') {
    parentSampled = true;
  } else if (matches[3] === '0') {
    parentSampled = false;
  }

  return {
    traceId: matches[1],
    parentSampled,
    parentSpanId: matches[2],
  };
}

/**
 * Create tracing context from incoming headers.
 */
function tracingContextFromHeaders(
  sentryTrace,
  baggage,
)

 {
  const traceparentData = extractTraceparentData(sentryTrace);
  const dynamicSamplingContext = baggageHeaderToDynamicSamplingContext(baggage);

  const { traceId, parentSpanId, parentSampled } = traceparentData || {};

  const propagationContext = {
    traceId: traceId || uuid4(),
    spanId: uuid4().substring(16),
    sampled: parentSampled,
  };

  if (parentSpanId) {
    propagationContext.parentSpanId = parentSpanId;
  }

  if (dynamicSamplingContext) {
    propagationContext.dsc = dynamicSamplingContext ;
  }

  return {
    traceparentData,
    dynamicSamplingContext,
    propagationContext,
  };
}

/**
 * Create sentry-trace header from span context values.
 */
function generateSentryTraceHeader(
  traceId = uuid4(),
  spanId = uuid4().substring(16),
  sampled,
) {
  let sampledString = '';
  if (sampled !== undefined) {
    sampledString = sampled ? '-1' : '-0';
  }
  return `${traceId}-${spanId}${sampledString}`;
}

export { TRACEPARENT_REGEXP, extractTraceparentData, generateSentryTraceHeader, tracingContextFromHeaders };
//# sourceMappingURL=tracing.js.map
