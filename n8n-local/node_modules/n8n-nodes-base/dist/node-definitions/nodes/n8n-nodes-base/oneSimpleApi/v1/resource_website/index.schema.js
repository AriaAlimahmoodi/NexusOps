/**
 * One Simple API - Website Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getPdfSchema = require('./operation_pdf.schema');
const getScreenshotSchema = require('./operation_screenshot.schema');
const getSeoSchema = require('./operation_seo.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'pdf' } : parameters;
  return z.union([
    getPdfSchema({ ...helpers, parameters: effectiveParams }),
    getScreenshotSchema({ ...helpers, parameters: effectiveParams }),
    getSeoSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};