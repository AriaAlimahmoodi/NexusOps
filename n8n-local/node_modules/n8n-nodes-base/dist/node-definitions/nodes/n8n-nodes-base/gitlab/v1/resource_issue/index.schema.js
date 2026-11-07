/**
 * GitLab - Issue Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCreateSchema = require('./operation_create.schema');
const getCreateCommentSchema = require('./operation_create_comment.schema');
const getEditSchema = require('./operation_edit.schema');
const getGetSchema = require('./operation_get.schema');
const getLockSchema = require('./operation_lock.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'create' } : parameters;
  return z.union([
    getCreateSchema({ ...helpers, parameters: effectiveParams }),
    getCreateCommentSchema({ ...helpers, parameters: effectiveParams }),
    getEditSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getLockSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};