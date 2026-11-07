/**
 * OpenAI Node - Version 2 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getTextSchema = require('./resource_text/index.schema');
const getImageSchema = require('./resource_image/index.schema');
const getAudioSchema = require('./resource_audio/index.schema');
const getFileSchema = require('./resource_file/index.schema');
const getConversationSchema = require('./resource_conversation/index.schema');
const getVideoSchema = require('./resource_video/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'text' } : parameters;
  return z.union([
    getTextSchema({ ...helpers, parameters: effectiveParams }),
    getImageSchema({ ...helpers, parameters: effectiveParams }),
    getAudioSchema({ ...helpers, parameters: effectiveParams }),
    getFileSchema({ ...helpers, parameters: effectiveParams }),
    getConversationSchema({ ...helpers, parameters: effectiveParams }),
    getVideoSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};