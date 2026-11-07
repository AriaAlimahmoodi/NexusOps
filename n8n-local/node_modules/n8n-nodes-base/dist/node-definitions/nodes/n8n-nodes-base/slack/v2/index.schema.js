/**
 * Slack Node - Version 2 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getChannelSchema = require('./resource_channel/index.schema');
const getFileSchema = require('./resource_file/index.schema');
const getMessageSchema = require('./resource_message/index.schema');
const getReactionSchema = require('./resource_reaction/index.schema');
const getStarSchema = require('./resource_star/index.schema');
const getUserSchema = require('./resource_user/index.schema');
const getUserGroupSchema = require('./resource_user_group/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'message' } : parameters;
  return z.union([
    getChannelSchema({ ...helpers, parameters: effectiveParams }),
    getFileSchema({ ...helpers, parameters: effectiveParams }),
    getMessageSchema({ ...helpers, parameters: effectiveParams }),
    getReactionSchema({ ...helpers, parameters: effectiveParams }),
    getStarSchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
    getUserGroupSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};