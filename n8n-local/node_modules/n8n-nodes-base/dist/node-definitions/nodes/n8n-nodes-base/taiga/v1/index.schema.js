/**
 * Taiga Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getEpicSchema = require('./resource_epic/index.schema');
const getIssueSchema = require('./resource_issue/index.schema');
const getTaskSchema = require('./resource_task/index.schema');
const getUserStorySchema = require('./resource_user_story/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'issue' } : parameters;
  return z.union([
    getEpicSchema({ ...helpers, parameters: effectiveParams }),
    getIssueSchema({ ...helpers, parameters: effectiveParams }),
    getTaskSchema({ ...helpers, parameters: effectiveParams }),
    getUserStorySchema({ ...helpers, parameters: effectiveParams }),
  ]);
};