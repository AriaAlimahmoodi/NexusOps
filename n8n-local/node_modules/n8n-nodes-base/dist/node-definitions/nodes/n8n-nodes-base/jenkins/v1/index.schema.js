/**
 * Jenkins Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getBuildSchema = require('./resource_build/index.schema');
const getInstanceSchema = require('./resource_instance/index.schema');
const getJobSchema = require('./resource_job/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'job' } : parameters;
  return z.union([
    getBuildSchema({ ...helpers, parameters: effectiveParams }),
    getInstanceSchema({ ...helpers, parameters: effectiveParams }),
    getJobSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};