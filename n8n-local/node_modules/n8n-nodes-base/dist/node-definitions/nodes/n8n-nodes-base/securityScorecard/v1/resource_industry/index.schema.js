/**
 * SecurityScorecard - Industry Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getGetFactorSchema = require('./operation_get_factor.schema');
const getGetFactorHistoricalSchema = require('./operation_get_factor_historical.schema');
const getGetScoreSchema = require('./operation_get_score.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'getFactor' } : parameters;
  return z.union([
    getGetFactorSchema({ ...helpers, parameters: effectiveParams }),
    getGetFactorHistoricalSchema({ ...helpers, parameters: effectiveParams }),
    getGetScoreSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};