/**
 * GitHub - User Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getGetRepositoriesSchema = require('./operation_get_repositories.schema');
const getGetUserIssuesSchema = require('./operation_get_user_issues.schema');
const getInviteSchema = require('./operation_invite.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'getRepositories' } : parameters;
  return z.union([
    getGetRepositoriesSchema({ ...helpers, parameters: effectiveParams }),
    getGetUserIssuesSchema({ ...helpers, parameters: effectiveParams }),
    getInviteSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};