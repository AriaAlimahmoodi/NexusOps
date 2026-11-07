/**
 * Splunk - Alert Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getGetMetricsSchema = require('./operation_get_metrics.schema');
const getGetReportSchema = require('./operation_get_report.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'getReport' } : parameters;
  return z.union([
    getGetMetricsSchema({ ...helpers, parameters: effectiveParams }),
    getGetReportSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};