/**
 * Microsoft Outlook Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getDraftSchema = require('./resource_draft/index.schema');
const getFolderSchema = require('./resource_folder/index.schema');
const getFolderMessageSchema = require('./resource_folder_message/index.schema');
const getMessageSchema = require('./resource_message/index.schema');
const getMessageAttachmentSchema = require('./resource_message_attachment/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'message' } : parameters;
  return z.union([
    getDraftSchema({ ...helpers, parameters: effectiveParams }),
    getFolderSchema({ ...helpers, parameters: effectiveParams }),
    getFolderMessageSchema({ ...helpers, parameters: effectiveParams }),
    getMessageSchema({ ...helpers, parameters: effectiveParams }),
    getMessageAttachmentSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};