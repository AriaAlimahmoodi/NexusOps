/**
 * Matrix Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAccountSchema = require('./resource_account/index.schema');
const getEventSchema = require('./resource_event/index.schema');
const getMediaSchema = require('./resource_media/index.schema');
const getMessageSchema = require('./resource_message/index.schema');
const getRoomSchema = require('./resource_room/index.schema');
const getRoomMemberSchema = require('./resource_room_member/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'message' } : parameters;
  return z.union([
    getAccountSchema({ ...helpers, parameters: effectiveParams }),
    getEventSchema({ ...helpers, parameters: effectiveParams }),
    getMediaSchema({ ...helpers, parameters: effectiveParams }),
    getMessageSchema({ ...helpers, parameters: effectiveParams }),
    getRoomSchema({ ...helpers, parameters: effectiveParams }),
    getRoomMemberSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};