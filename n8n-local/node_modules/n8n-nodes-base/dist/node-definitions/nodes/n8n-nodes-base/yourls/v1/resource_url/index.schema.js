/**
 * Yourls - Url Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getExpandSchema = require('./operation_expand.schema');
const getShortenSchema = require('./operation_shorten.schema');
const getStatsSchema = require('./operation_stats.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'shorten' } : parameters;
  return z.union([
    getExpandSchema({ ...helpers, parameters: effectiveParams }),
    getShortenSchema({ ...helpers, parameters: effectiveParams }),
    getStatsSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};