/**
 * Tapfiliate Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAffiliateSchema = require('./resource_affiliate/index.schema');
const getAffiliateMetadataSchema = require('./resource_affiliate_metadata/index.schema');
const getProgramAffiliateSchema = require('./resource_program_affiliate/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'affiliate' } : parameters;
  return z.union([
    getAffiliateSchema({ ...helpers, parameters: effectiveParams }),
    getAffiliateMetadataSchema({ ...helpers, parameters: effectiveParams }),
    getProgramAffiliateSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};