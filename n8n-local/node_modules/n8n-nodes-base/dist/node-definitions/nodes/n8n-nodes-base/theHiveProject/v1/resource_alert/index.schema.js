/**
 * TheHive 5 - Alert Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCreateSchema = require('./operation_create.schema');
const getDeleteAlertSchema = require('./operation_delete_alert.schema');
const getExecuteResponderSchema = require('./operation_execute_responder.schema');
const getGetSchema = require('./operation_get.schema');
const getMergeSchema = require('./operation_merge.schema');
const getPromoteSchema = require('./operation_promote.schema');
const getSearchSchema = require('./operation_search.schema');
const getStatusSchema = require('./operation_status.schema');
const getUpdateSchema = require('./operation_update.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'create' } : parameters;
  return z.union([
    getCreateSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteAlertSchema({ ...helpers, parameters: effectiveParams }),
    getExecuteResponderSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getMergeSchema({ ...helpers, parameters: effectiveParams }),
    getPromoteSchema({ ...helpers, parameters: effectiveParams }),
    getSearchSchema({ ...helpers, parameters: effectiveParams }),
    getStatusSchema({ ...helpers, parameters: effectiveParams }),
    getUpdateSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};