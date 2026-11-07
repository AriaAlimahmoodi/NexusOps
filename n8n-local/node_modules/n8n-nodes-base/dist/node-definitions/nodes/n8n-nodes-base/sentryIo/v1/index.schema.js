/**
 * Sentry.io Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getEventSchema = require('./resource_event/index.schema');
const getIssueSchema = require('./resource_issue/index.schema');
const getOrganizationSchema = require('./resource_organization/index.schema');
const getProjectSchema = require('./resource_project/index.schema');
const getReleaseSchema = require('./resource_release/index.schema');
const getTeamSchema = require('./resource_team/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'event' } : parameters;
  return z.union([
    getEventSchema({ ...helpers, parameters: effectiveParams }),
    getIssueSchema({ ...helpers, parameters: effectiveParams }),
    getOrganizationSchema({ ...helpers, parameters: effectiveParams }),
    getProjectSchema({ ...helpers, parameters: effectiveParams }),
    getReleaseSchema({ ...helpers, parameters: effectiveParams }),
    getTeamSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};