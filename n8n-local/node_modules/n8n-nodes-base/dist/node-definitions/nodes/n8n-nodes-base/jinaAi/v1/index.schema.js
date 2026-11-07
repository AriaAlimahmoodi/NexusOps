/**
 * Jina AI Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getReaderSchema = require('./resource_reader/index.schema');
const getResearchSchema = require('./resource_research/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'reader' } : parameters;
  return z.union([
    getReaderSchema({ ...helpers, parameters: effectiveParams }),
    getResearchSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};