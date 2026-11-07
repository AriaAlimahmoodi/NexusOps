/**
 * Copper Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCompanySchema = require('./resource_company/index.schema');
const getCustomerSourceSchema = require('./resource_customer_source/index.schema');
const getLeadSchema = require('./resource_lead/index.schema');
const getOpportunitySchema = require('./resource_opportunity/index.schema');
const getPersonSchema = require('./resource_person/index.schema');
const getProjectSchema = require('./resource_project/index.schema');
const getTaskSchema = require('./resource_task/index.schema');
const getUserSchema = require('./resource_user/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'company' } : parameters;
  return z.union([
    getCompanySchema({ ...helpers, parameters: effectiveParams }),
    getCustomerSourceSchema({ ...helpers, parameters: effectiveParams }),
    getLeadSchema({ ...helpers, parameters: effectiveParams }),
    getOpportunitySchema({ ...helpers, parameters: effectiveParams }),
    getPersonSchema({ ...helpers, parameters: effectiveParams }),
    getProjectSchema({ ...helpers, parameters: effectiveParams }),
    getTaskSchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};