/**
 * Intercom Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCompanySchema = require('./resource_company/index.schema');
const getLeadSchema = require('./resource_lead/index.schema');
const getUserSchema = require('./resource_user/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'user' } : parameters;
  return z.union([
    getCompanySchema({ ...helpers, parameters: effectiveParams }),
    getLeadSchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};