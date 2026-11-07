/**
 * Lemlist Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getActivitySchema = require('./resource_activity/index.schema');
const getCampaignSchema = require('./resource_campaign/index.schema');
const getLeadSchema = require('./resource_lead/index.schema');
const getTeamSchema = require('./resource_team/index.schema');
const getUnsubscribeSchema = require('./resource_unsubscribe/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'activity' } : parameters;
  return z.union([
    getActivitySchema({ ...helpers, parameters: effectiveParams }),
    getCampaignSchema({ ...helpers, parameters: effectiveParams }),
    getLeadSchema({ ...helpers, parameters: effectiveParams }),
    getTeamSchema({ ...helpers, parameters: effectiveParams }),
    getUnsubscribeSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};