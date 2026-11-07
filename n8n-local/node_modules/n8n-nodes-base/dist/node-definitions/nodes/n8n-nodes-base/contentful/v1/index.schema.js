/**
 * Contentful Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAssetSchema = require('./resource_asset/index.schema');
const getContentTypeSchema = require('./resource_content_type/index.schema');
const getEntrySchema = require('./resource_entry/index.schema');
const getLocaleSchema = require('./resource_locale/index.schema');
const getSpaceSchema = require('./resource_space/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'entry' } : parameters;
  return z.union([
    getAssetSchema({ ...helpers, parameters: effectiveParams }),
    getContentTypeSchema({ ...helpers, parameters: effectiveParams }),
    getEntrySchema({ ...helpers, parameters: effectiveParams }),
    getLocaleSchema({ ...helpers, parameters: effectiveParams }),
    getSpaceSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};