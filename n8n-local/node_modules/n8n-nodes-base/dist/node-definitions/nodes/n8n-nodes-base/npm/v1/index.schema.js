/**
 * Npm Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getPackageSchema = require('./resource_package/index.schema');
const getDistTagSchema = require('./resource_dist_tag/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'package' } : parameters;
  return z.union([
    getPackageSchema({ ...helpers, parameters: effectiveParams }),
    getDistTagSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};