/**
 * TheHive 5 - Case Resource - Zod Schema Factory
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
const getDeleteCaseSchema = require('./operation_delete_case.schema');
const getExecuteResponderSchema = require('./operation_execute_responder.schema');
const getGetSchema = require('./operation_get.schema');
const getGetAttachmentSchema = require('./operation_get_attachment.schema');
const getGetTimelineSchema = require('./operation_get_timeline.schema');
const getSearchSchema = require('./operation_search.schema');
const getUpdateSchema = require('./operation_update.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'create' } : parameters;
  return z.union([
    getAddAttachmentSchema({ ...helpers, parameters: effectiveParams }),
    getCreateSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteAttachmentSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteCaseSchema({ ...helpers, parameters: effectiveParams }),
    getExecuteResponderSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getGetAttachmentSchema({ ...helpers, parameters: effectiveParams }),
    getGetTimelineSchema({ ...helpers, parameters: effectiveParams }),
    getSearchSchema({ ...helpers, parameters: effectiveParams }),
    getUpdateSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};