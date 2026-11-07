/**
 * Trello - Checklist Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCompletedCheckItemsSchema = require('./operation_completed_check_items.schema');
const getCreateSchema = require('./operation_create.schema');
const getCreateCheckItemSchema = require('./operation_create_check_item.schema');
const getDeleteSchema = require('./operation_delete.schema');
const getDeleteCheckItemSchema = require('./operation_delete_check_item.schema');
const getGetSchema = require('./operation_get.schema');
const getGetAllSchema = require('./operation_get_all.schema');
const getGetCheckItemSchema = require('./operation_get_check_item.schema');
const getUpdateCheckItemSchema = require('./operation_update_check_item.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'getAll' } : parameters;
  return z.union([
    getCompletedCheckItemsSchema({ ...helpers, parameters: effectiveParams }),
    getCreateSchema({ ...helpers, parameters: effectiveParams }),
    getCreateCheckItemSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteCheckItemSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getGetAllSchema({ ...helpers, parameters: effectiveParams }),
    getGetCheckItemSchema({ ...helpers, parameters: effectiveParams }),
    getUpdateCheckItemSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};