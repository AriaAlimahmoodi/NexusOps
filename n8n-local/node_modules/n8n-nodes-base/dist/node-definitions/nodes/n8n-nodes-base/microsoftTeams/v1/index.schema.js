/**
 * Microsoft Teams Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getChannelSchema = require('./resource_channel/index.schema');
const getChannelMessageSchema = require('./resource_channel_message/index.schema');
const getChatMessageSchema = require('./resource_chat_message/index.schema');
const getTaskSchema = require('./resource_task/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'channel' } : parameters;
  return z.union([
    getChannelSchema({ ...helpers, parameters: effectiveParams }),
    getChannelMessageSchema({ ...helpers, parameters: effectiveParams }),
    getChatMessageSchema({ ...helpers, parameters: effectiveParams }),
    getTaskSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};