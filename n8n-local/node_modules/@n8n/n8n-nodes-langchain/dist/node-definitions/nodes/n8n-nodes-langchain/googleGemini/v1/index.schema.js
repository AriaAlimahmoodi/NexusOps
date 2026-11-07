/**
 * Google Gemini Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAudioSchema = require('./resource_audio/index.schema');
const getDocumentSchema = require('./resource_document/index.schema');
const getFileSearchSchema = require('./resource_file_search/index.schema');
const getImageSchema = require('./resource_image/index.schema');
const getFileSchema = require('./resource_file/index.schema');
const getTextSchema = require('./resource_text/index.schema');
const getVideoSchema = require('./resource_video/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'text' } : parameters;
  return z.union([
    getAudioSchema({ ...helpers, parameters: effectiveParams }),
    getDocumentSchema({ ...helpers, parameters: effectiveParams }),
    getFileSearchSchema({ ...helpers, parameters: effectiveParams }),
    getImageSchema({ ...helpers, parameters: effectiveParams }),
    getFileSchema({ ...helpers, parameters: effectiveParams }),
    getTextSchema({ ...helpers, parameters: effectiveParams }),
    getVideoSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};