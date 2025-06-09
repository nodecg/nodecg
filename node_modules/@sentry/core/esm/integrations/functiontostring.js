import { getOriginalFunction } from '@sentry/utils';
import { convertIntegrationFnToClass } from '../integration.js';

let originalFunctionToString;

const INTEGRATION_NAME = 'FunctionToString';

const functionToStringIntegration = () => {
  return {
    name: INTEGRATION_NAME,
    setupOnce() {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      originalFunctionToString = Function.prototype.toString;

      // intrinsics (like Function.prototype) might be immutable in some environments
      // e.g. Node with --frozen-intrinsics, XS (an embedded JavaScript engine) or SES (a JavaScript proposal)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Function.prototype.toString = function ( ...args) {
          const context = getOriginalFunction(this) || this;
          return originalFunctionToString.apply(context, args);
        };
      } catch (e) {
        // ignore errors here, just don't patch this
      }
    },
  };
};

/** Patch toString calls to return proper name for wrapped functions */
// eslint-disable-next-line deprecation/deprecation
const FunctionToString = convertIntegrationFnToClass(INTEGRATION_NAME, functionToStringIntegration);

export { FunctionToString };
//# sourceMappingURL=functiontostring.js.map
