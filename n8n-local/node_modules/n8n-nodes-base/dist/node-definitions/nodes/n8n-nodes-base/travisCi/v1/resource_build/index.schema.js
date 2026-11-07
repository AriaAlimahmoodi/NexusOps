/**
 * TravisCI - Build Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCancelSchema = require('./operation_cancel.schema');
const getGetSchema = require('./operation_get.schema');
const getGetAllSchema = require('./operation_get_all.schema');
const getRestartSchema = require('./operation_restart.schema');
const getTriggerSchema = require('./operation_trigger.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'cancel' } : parameters;
  return z.union([
    getCancelSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getGetAllSchema({ ...helpers, parameters: effectiveParams }),
    getRestartSchema({ ...helpers, parameters: effectiveParams }),
    getTriggerSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};