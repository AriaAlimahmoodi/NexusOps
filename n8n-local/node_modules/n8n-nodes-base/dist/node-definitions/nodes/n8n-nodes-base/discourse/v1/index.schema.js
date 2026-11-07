/**
 * Discourse Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCategorySchema = require('./resource_category/index.schema');
const getGroupSchema = require('./resource_group/index.schema');
const getPostSchema = require('./resource_post/index.schema');
const getUserSchema = require('./resource_user/index.schema');
const getUserGroupSchema = require('./resource_user_group/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'post' } : parameters;
  return z.union([
    getCategorySchema({ ...helpers, parameters: effectiveParams }),
    getGroupSchema({ ...helpers, parameters: effectiveParams }),
    getPostSchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
    getUserGroupSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};