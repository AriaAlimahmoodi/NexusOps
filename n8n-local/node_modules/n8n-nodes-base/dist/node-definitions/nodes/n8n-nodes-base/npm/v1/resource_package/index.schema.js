/**
 * Npm - Package Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getGetMetadataSchema = require('./operation_get_metadata.schema');
const getGetVersionsSchema = require('./operation_get_versions.schema');
const getSearchSchema = require('./operation_search.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'getMetadata' } : parameters;
  return z.union([
    getGetMetadataSchema({ ...helpers, parameters: effectiveParams }),
    getGetVersionsSchema({ ...helpers, parameters: effectiveParams }),
    getSearchSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};