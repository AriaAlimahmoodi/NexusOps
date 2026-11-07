/**
 * Telegram Node - Version 1.1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getChatSchema = require('./resource_chat/index.schema');
const getCallbackSchema = require('./resource_callback/index.schema');
const getFileSchema = require('./resource_file/index.schema');
const getMessageSchema = require('./resource_message/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'message' } : parameters;
  return z.union([
    getChatSchema({ ...helpers, parameters: effectiveParams }),
    getCallbackSchema({ ...helpers, parameters: effectiveParams }),
    getFileSchema({ ...helpers, parameters: effectiveParams }),
    getMessageSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};