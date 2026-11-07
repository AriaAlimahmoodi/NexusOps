/**
 * Customer.io Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCustomerSchema = require('./resource_customer/index.schema');
const getEventSchema = require('./resource_event/index.schema');
const getCampaignSchema = require('./resource_campaign/index.schema');
const getSegmentSchema = require('./resource_segment/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'customer' } : parameters;
  return z.union([
    getCustomerSchema({ ...helpers, parameters: effectiveParams }),
    getEventSchema({ ...helpers, parameters: effectiveParams }),
    getCampaignSchema({ ...helpers, parameters: effectiveParams }),
    getSegmentSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};