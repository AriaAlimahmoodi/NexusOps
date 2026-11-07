/**
 * Reddit Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getPostSchema = require('./resource_post/index.schema');
const getPostCommentSchema = require('./resource_post_comment/index.schema');
const getProfileSchema = require('./resource_profile/index.schema');
const getSubredditSchema = require('./resource_subreddit/index.schema');
const getUserSchema = require('./resource_user/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'post' } : parameters;
  return z.union([
    getPostSchema({ ...helpers, parameters: effectiveParams }),
    getPostCommentSchema({ ...helpers, parameters: effectiveParams }),
    getProfileSchema({ ...helpers, parameters: effectiveParams }),
    getSubredditSchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};