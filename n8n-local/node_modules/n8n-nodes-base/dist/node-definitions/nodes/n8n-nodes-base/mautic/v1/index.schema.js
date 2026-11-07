/**
 * Mautic Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCampaignContactSchema = require('./resource_campaign_contact/index.schema');
const getCompanySchema = require('./resource_company/index.schema');
const getCompanyContactSchema = require('./resource_company_contact/index.schema');
const getContactSchema = require('./resource_contact/index.schema');
const getContactSegmentSchema = require('./resource_contact_segment/index.schema');
const getSegmentEmailSchema = require('./resource_segment_email/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'contact' } : parameters;
  return z.union([
    getCampaignContactSchema({ ...helpers, parameters: effectiveParams }),
    getCompanySchema({ ...helpers, parameters: effectiveParams }),
    getCompanyContactSchema({ ...helpers, parameters: effectiveParams }),
    getContactSchema({ ...helpers, parameters: effectiveParams }),
    getContactSegmentSchema({ ...helpers, parameters: effectiveParams }),
    getSegmentEmailSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};