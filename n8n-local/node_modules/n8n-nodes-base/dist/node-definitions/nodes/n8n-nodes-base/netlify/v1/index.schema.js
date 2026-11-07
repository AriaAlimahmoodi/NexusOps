/**
 * Netlify Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getDeploySchema = require('./resource_deploy/index.schema');
const getSiteSchema = require('./resource_site/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'deploy' } : parameters;
  return z.union([
    getDeploySchema({ ...helpers, parameters: effectiveParams }),
    getSiteSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};