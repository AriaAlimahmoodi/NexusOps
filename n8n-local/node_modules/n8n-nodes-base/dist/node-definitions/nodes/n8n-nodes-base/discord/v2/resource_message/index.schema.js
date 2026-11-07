/**
 * Discord - Message Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getDeleteMessageSchema = require('./operation_delete_message.schema');
const getGetSchema = require('./operation_get.schema');
const getGetAllSchema = require('./operation_get_all.schema');
const getReactSchema = require('./operation_react.schema');
const getSendSchema = require('./operation_send.schema');
const getSendAndWaitSchema = require('./operation_send_and_wait.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'send' } : parameters;
  return z.union([
    getDeleteMessageSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getGetAllSchema({ ...helpers, parameters: effectiveParams }),
    getReactSchema({ ...helpers, parameters: effectiveParams }),
    getSendSchema({ ...helpers, parameters: effectiveParams }),
    getSendAndWaitSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};