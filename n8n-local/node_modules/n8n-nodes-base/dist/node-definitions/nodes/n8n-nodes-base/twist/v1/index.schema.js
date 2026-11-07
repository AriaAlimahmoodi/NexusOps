/**
 * Twist Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getChannelSchema = require('./resource_channel/index.schema');
const getCommentSchema = require('./resource_comment/index.schema');
const getMessageConversationSchema = require('./resource_message_conversation/index.schema');
const getThreadSchema = require('./resource_thread/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'messageConversation' } : parameters;
  return z.union([
    getChannelSchema({ ...helpers, parameters: effectiveParams }),
    getCommentSchema({ ...helpers, parameters: effectiveParams }),
    getMessageConversationSchema({ ...helpers, parameters: effectiveParams }),
    getThreadSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};