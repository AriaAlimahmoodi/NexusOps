/**
 * Google Sheets - Sheet Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAppendSchema = require('./operation_append.schema');
const getAppendOrUpdateSchema = require('./operation_append_or_update.schema');
const getClearSchema = require('./operation_clear.schema');
const getCreateSchema = require('./operation_create.schema');
const getDeleteSchema = require('./operation_delete.schema');
const getReadSchema = require('./operation_read.schema');
const getRemoveSchema = require('./operation_remove.schema');
const getUpdateSchema = require('./operation_update.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'read' } : parameters;
  return z.union([
    getAppendSchema({ ...helpers, parameters: effectiveParams }),
    getAppendOrUpdateSchema({ ...helpers, parameters: effectiveParams }),
    getClearSchema({ ...helpers, parameters: effectiveParams }),
    getCreateSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteSchema({ ...helpers, parameters: effectiveParams }),
    getReadSchema({ ...helpers, parameters: effectiveParams }),
    getRemoveSchema({ ...helpers, parameters: effectiveParams }),
    getUpdateSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};