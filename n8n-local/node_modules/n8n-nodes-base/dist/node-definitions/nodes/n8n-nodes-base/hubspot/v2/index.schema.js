/**
 * HubSpot Node - Version 2 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCompanySchema = require('./resource_company/index.schema');
const getContactSchema = require('./resource_contact/index.schema');
const getContactListSchema = require('./resource_contact_list/index.schema');
const getDealSchema = require('./resource_deal/index.schema');
const getEngagementSchema = require('./resource_engagement/index.schema');
const getTicketSchema = require('./resource_ticket/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'contact' } : parameters;
  return z.union([
    getCompanySchema({ ...helpers, parameters: effectiveParams }),
    getContactSchema({ ...helpers, parameters: effectiveParams }),
    getContactListSchema({ ...helpers, parameters: effectiveParams }),
    getDealSchema({ ...helpers, parameters: effectiveParams }),
    getEngagementSchema({ ...helpers, parameters: effectiveParams }),
    getTicketSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};