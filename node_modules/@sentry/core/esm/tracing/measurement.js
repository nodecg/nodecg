import { getActiveTransaction } from './utils.js';

/**
 * Adds a measurement to the current active transaction.
 */
function setMeasurement(name, value, unit) {
  const transaction = getActiveTransaction();
  if (transaction) {
    transaction.setMeasurement(name, value, unit);
  }
}

export { setMeasurement };
//# sourceMappingURL=measurement.js.map
