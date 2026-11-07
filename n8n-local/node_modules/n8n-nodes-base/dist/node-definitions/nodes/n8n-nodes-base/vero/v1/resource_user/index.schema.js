/**
 * Vero - User Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAddTagsSchema = require('./operation_add_tags.schema');
const getAliasSchema = require('./operation_alias.schema');
const getCreateSchema = require('./operation_create.schema');
const getDeleteSchema = require('./operation_delete.schema');
const getRemoveTagsSchema = require('./operation_remove_tags.schema');
const getResubscribeSchema = require('./operation_resubscribe.schema');
const getUnsubscribeSchema = require('./operation_unsubscribe.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'create' } : parameters;
  return z.union([
    getAddTagsSchema({ ...helpers, parameters: effectiveParams }),
    getAliasSchema({ ...helpers, parameters: effectiveParams }),
    getCreateSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteSchema({ ...helpers, parameters: effectiveParams }),
    getRemoveTagsSchema({ ...helpers, parameters: effectiveParams }),
    getResubscribeSchema({ ...helpers, parameters: effectiveParams }),
    getUnsubscribeSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};