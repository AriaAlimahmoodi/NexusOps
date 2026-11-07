/**
 * Zulip - Message Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getDeleteSchema = require('./operation_delete.schema');
const getGetSchema = require('./operation_get.schema');
const getSendPrivateSchema = require('./operation_send_private.schema');
const getSendStreamSchema = require('./operation_send_stream.schema');
const getUpdateSchema = require('./operation_update.schema');
const getUpdateFileSchema = require('./operation_update_file.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'sendPrivate' } : parameters;
  return z.union([
    getDeleteSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getSendPrivateSchema({ ...helpers, parameters: effectiveParams }),
    getSendStreamSchema({ ...helpers, parameters: effectiveParams }),
    getUpdateSchema({ ...helpers, parameters: effectiveParams }),
    getUpdateFileSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};