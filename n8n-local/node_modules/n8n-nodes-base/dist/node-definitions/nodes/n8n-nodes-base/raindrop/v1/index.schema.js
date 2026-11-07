/**
 * Raindrop Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getBookmarkSchema = require('./resource_bookmark/index.schema');
const getCollectionSchema = require('./resource_collection/index.schema');
const getTagSchema = require('./resource_tag/index.schema');
const getUserSchema = require('./resource_user/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'collection' } : parameters;
  return z.union([
    getBookmarkSchema({ ...helpers, parameters: effectiveParams }),
    getCollectionSchema({ ...helpers, parameters: effectiveParams }),
    getTagSchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};