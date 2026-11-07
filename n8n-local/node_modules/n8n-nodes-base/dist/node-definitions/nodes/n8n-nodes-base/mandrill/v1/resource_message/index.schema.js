/**
 * Mandrill - Message Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getSendHtmlSchema = require('./operation_send_html.schema');
const getSendTemplateSchema = require('./operation_send_template.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'sendTemplate' } : parameters;
  return z.union([
    getSendHtmlSchema({ ...helpers, parameters: effectiveParams }),
    getSendTemplateSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};