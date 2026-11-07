/**
 * Jira Software Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getIssueSchema = require('./resource_issue/index.schema');
const getIssueAttachmentSchema = require('./resource_issue_attachment/index.schema');
const getIssueCommentSchema = require('./resource_issue_comment/index.schema');
const getUserSchema = require('./resource_user/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'issue' } : parameters;
  return z.union([
    getIssueSchema({ ...helpers, parameters: effectiveParams }),
    getIssueAttachmentSchema({ ...helpers, parameters: effectiveParams }),
    getIssueCommentSchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};