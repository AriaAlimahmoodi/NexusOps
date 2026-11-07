/**
 * GitLab Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getFileSchema = require('./resource_file/index.schema');
const getIssueSchema = require('./resource_issue/index.schema');
const getReleaseSchema = require('./resource_release/index.schema');
const getRepositorySchema = require('./resource_repository/index.schema');
const getUserSchema = require('./resource_user/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'issue' } : parameters;
  return z.union([
    getFileSchema({ ...helpers, parameters: effectiveParams }),
    getIssueSchema({ ...helpers, parameters: effectiveParams }),
    getReleaseSchema({ ...helpers, parameters: effectiveParams }),
    getRepositorySchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};