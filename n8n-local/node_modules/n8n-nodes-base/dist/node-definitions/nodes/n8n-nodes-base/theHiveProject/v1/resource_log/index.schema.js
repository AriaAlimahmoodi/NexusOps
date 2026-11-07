/**
 * TheHive 5 - Log Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAddAttachmentSchema = require('./operation_add_attachment.schema');
const getCreateSchema = require('./operation_create.schema');
const getDeleteAttachmentSchema = require('./operation_delete_attachment.schema');
const getDeleteLogSchema = require('./operation_delete_log.schema');
const getExecuteResponderSchema = require('./operation_execute_responder.schema');
const getGetSchema = require('./operation_get.schema');
const getSearchSchema = require('./operation_search.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'create' } : parameters;
  return z.union([
    getAddAttachmentSchema({ ...helpers, parameters: effectiveParams }),
    getCreateSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteAttachmentSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteLogSchema({ ...helpers, parameters: effectiveParams }),
    getExecuteResponderSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getSearchSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};