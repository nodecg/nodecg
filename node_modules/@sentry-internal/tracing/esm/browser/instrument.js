import { logger, getFunctionName } from '@sentry/utils';
import { DEBUG_BUILD } from '../common/debug-build.js';
import { onCLS } from './web-vitals/getCLS.js';
import { onFID } from './web-vitals/getFID.js';
import { onLCP } from './web-vitals/getLCP.js';
import { observe } from './web-vitals/lib/observe.js';

const handlers = {};
const instrumented = {};

let _previousCls;
let _previousFid;
let _previousLcp;

/**
 * Add a callback that will be triggered when a CLS metric is available.
 * Returns a cleanup callback which can be called to remove the instrumentation handler.
 */
function addClsInstrumentationHandler(callback) {
  return addMetricObserver('cls', callback, instrumentCls, _previousCls);
}

/**
 * Add a callback that will be triggered when a LCP metric is available.
 * Returns a cleanup callback which can be called to remove the instrumentation handler.
 */
function addLcpInstrumentationHandler(callback) {
  return addMetricObserver('lcp', callback, instrumentLcp, _previousLcp);
}

/**
 * Add a callback that will be triggered when a FID metric is available.
 * Returns a cleanup callback which can be called to remove the instrumentation handler.
 */
function addFidInstrumentationHandler(callback) {
  return addMetricObserver('fid', callback, instrumentFid, _previousFid);
}

/**
 * Add a callback that will be triggered when a performance observer is triggered,
 * and receives the entries of the observer.
 * Returns a cleanup callback which can be called to remove the instrumentation handler.
 */
function addPerformanceInstrumentationHandler(
  type,
  callback,
) {
  addHandler(type, callback);

  if (!instrumented[type]) {
    instrumentPerformanceObserver(type);
    instrumented[type] = true;
  }

  return getCleanupCallback(type, callback);
}

/** Trigger all handlers of a given type. */
function triggerHandlers(type, data) {
  const typeHandlers = handlers[type];

  if (!typeHandlers || !typeHandlers.length) {
    return;
  }

  for (const handler of typeHandlers) {
    try {
      handler(data);
    } catch (e) {
      DEBUG_BUILD &&
        logger.error(
          `Error while triggering instrumentation handler.\nType: ${type}\nName: ${getFunctionName(handler)}\nError:`,
          e,
        );
    }
  }
}

function instrumentCls() {
  onCLS(metric => {
    triggerHandlers('cls', {
      metric,
    });
    _previousCls = metric;
  });
}

function instrumentFid() {
  onFID(metric => {
    triggerHandlers('fid', {
      metric,
    });
    _previousFid = metric;
  });
}

function instrumentLcp() {
  onLCP(metric => {
    triggerHandlers('lcp', {
      metric,
    });
    _previousLcp = metric;
  });
}

function addMetricObserver(
  type,
  callback,
  instrumentFn,
  previousValue,
) {
  addHandler(type, callback);

  if (!instrumented[type]) {
    instrumentFn();
    instrumented[type] = true;
  }

  if (previousValue) {
    callback({ metric: previousValue });
  }

  return getCleanupCallback(type, callback);
}

function instrumentPerformanceObserver(type) {
  const options = {};

  // Special per-type options we want to use
  if (type === 'event') {
    options.durationThreshold = 0;
  }

  observe(
    type,
    entries => {
      triggerHandlers(type, { entries });
    },
    options,
  );
}

function addHandler(type, handler) {
  handlers[type] = handlers[type] || [];
  (handlers[type] ).push(handler);
}

// Get a callback which can be called to remove the instrumentation handler
function getCleanupCallback(type, callback) {
  return () => {
    const typeHandlers = handlers[type];

    if (!typeHandlers) {
      return;
    }

    const index = typeHandlers.indexOf(callback);
    if (index !== -1) {
      typeHandlers.splice(index, 1);
    }
  };
}

export { addClsInstrumentationHandler, addFidInstrumentationHandler, addLcpInstrumentationHandler, addPerformanceInstrumentationHandler };
//# sourceMappingURL=instrument.js.map
