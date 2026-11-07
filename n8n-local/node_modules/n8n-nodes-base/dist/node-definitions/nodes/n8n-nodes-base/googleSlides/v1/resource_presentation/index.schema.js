/**
 * Google Slides - Presentation Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCreateSchema = require('./operation_create.schema');
const getGetSchema = require('./operation_get.schema');
const getGetSlidesSchema = require('./operation_get_slides.schema');
const getReplaceTextSchema = require('./operation_replace_text.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'create' } : parameters;
  return z.union([
    getCreateSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getGetSlidesSchema({ ...helpers, parameters: effectiveParams }),
    getReplaceTextSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};