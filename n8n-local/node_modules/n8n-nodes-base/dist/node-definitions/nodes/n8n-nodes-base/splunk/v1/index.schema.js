/**
 * Splunk Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getFiredAlertSchema = require('./resource_fired_alert/index.schema');
const getSearchConfigurationSchema = require('./resource_search_configuration/index.schema');
const getSearchJobSchema = require('./resource_search_job/index.schema');
const getSearchResultSchema = require('./resource_search_result/index.schema');
const getUserSchema = require('./resource_user/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'searchJob' } : parameters;
  return z.union([
    getFiredAlertSchema({ ...helpers, parameters: effectiveParams }),
    getSearchConfigurationSchema({ ...helpers, parameters: effectiveParams }),
    getSearchJobSchema({ ...helpers, parameters: effectiveParams }),
    getSearchResultSchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};