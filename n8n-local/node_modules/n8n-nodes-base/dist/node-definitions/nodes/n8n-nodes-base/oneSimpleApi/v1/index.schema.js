/**
 * One Simple API Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getInformationSchema = require('./resource_information/index.schema');
const getSocialProfileSchema = require('./resource_social_profile/index.schema');
const getUtilitySchema = require('./resource_utility/index.schema');
const getWebsiteSchema = require('./resource_website/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'website' } : parameters;
  return z.union([
    getInformationSchema({ ...helpers, parameters: effectiveParams }),
    getSocialProfileSchema({ ...helpers, parameters: effectiveParams }),
    getUtilitySchema({ ...helpers, parameters: effectiveParams }),
    getWebsiteSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};