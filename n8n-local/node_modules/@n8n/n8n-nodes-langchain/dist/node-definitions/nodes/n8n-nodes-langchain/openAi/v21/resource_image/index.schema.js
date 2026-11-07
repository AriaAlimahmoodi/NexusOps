/**
 * OpenAI - Image Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAnalyzeSchema = require('./operation_analyze.schema');
const getEditSchema = require('./operation_edit.schema');
const getGenerateSchema = require('./operation_generate.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'generate' } : parameters;
  return z.union([
    getAnalyzeSchema({ ...helpers, parameters: effectiveParams }),
    getEditSchema({ ...helpers, parameters: effectiveParams }),
    getGenerateSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};