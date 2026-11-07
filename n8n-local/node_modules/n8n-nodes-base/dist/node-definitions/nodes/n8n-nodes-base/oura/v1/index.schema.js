/**
 * Oura Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getProfileSchema = require('./resource_profile/index.schema');
const getSummarySchema = require('./resource_summary/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'summary' } : parameters;
  return z.union([
    getProfileSchema({ ...helpers, parameters: effectiveParams }),
    getSummarySchema({ ...helpers, parameters: effectiveParams }),
  ]);
};