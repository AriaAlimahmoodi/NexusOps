/**
 * Discord Node - Version 2 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getChannelSchema = require('./resource_channel/index.schema');
const getMessageSchema = require('./resource_message/index.schema');
const getMemberSchema = require('./resource_member/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'channel' } : parameters;
  return z.union([
    getChannelSchema({ ...helpers, parameters: effectiveParams }),
    getMessageSchema({ ...helpers, parameters: effectiveParams }),
    getMemberSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};