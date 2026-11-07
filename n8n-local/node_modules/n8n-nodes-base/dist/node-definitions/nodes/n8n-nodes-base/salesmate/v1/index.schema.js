/**
 * Salesmate Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getActivitySchema = require('./resource_activity/index.schema');
const getCompanySchema = require('./resource_company/index.schema');
const getDealSchema = require('./resource_deal/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'activity' } : parameters;
  return z.union([
    getActivitySchema({ ...helpers, parameters: effectiveParams }),
    getCompanySchema({ ...helpers, parameters: effectiveParams }),
    getDealSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};