/**
 * Google Slides Node - Version 2 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getPageSchema = require('./resource_page/index.schema');
const getPresentationSchema = require('./resource_presentation/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'presentation' } : parameters;
  return z.union([
    getPageSchema({ ...helpers, parameters: effectiveParams }),
    getPresentationSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};