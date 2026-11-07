/**
 * Jenkins - Job Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCopySchema = require('./operation_copy.schema');
const getCreateSchema = require('./operation_create.schema');
const getTriggerSchema = require('./operation_trigger.schema');
const getTriggerParamsSchema = require('./operation_trigger_params.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'trigger' } : parameters;
  return z.union([
    getCopySchema({ ...helpers, parameters: effectiveParams }),
    getCreateSchema({ ...helpers, parameters: effectiveParams }),
    getTriggerSchema({ ...helpers, parameters: effectiveParams }),
    getTriggerParamsSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};