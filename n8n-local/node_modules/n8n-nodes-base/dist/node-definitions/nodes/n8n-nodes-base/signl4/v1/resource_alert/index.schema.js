/**
 * SIGNL4 - Alert Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getResolveSchema = require('./operation_resolve.schema');
const getSendSchema = require('./operation_send.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'send' } : parameters;
  return z.union([
    getResolveSchema({ ...helpers, parameters: effectiveParams }),
    getSendSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};