/**
 * Linear Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCommentSchema = require('./resource_comment/index.schema');
const getIssueSchema = require('./resource_issue/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'issue' } : parameters;
  return z.union([
    getCommentSchema({ ...helpers, parameters: effectiveParams }),
    getIssueSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};