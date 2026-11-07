/**
 * Disqus - Forum Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getGetSchema = require('./operation_get.schema');
const getGetCategoriesSchema = require('./operation_get_categories.schema');
const getGetPostsSchema = require('./operation_get_posts.schema');
const getGetThreadsSchema = require('./operation_get_threads.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'get' } : parameters;
  return z.union([
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getGetCategoriesSchema({ ...helpers, parameters: effectiveParams }),
    getGetPostsSchema({ ...helpers, parameters: effectiveParams }),
    getGetThreadsSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};