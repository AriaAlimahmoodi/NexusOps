/**
 * Google Sheets  Node - Version 2 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getSpreadsheetSchema = require('./resource_spreadsheet/index.schema');
const getSheetSchema = require('./resource_sheet/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'sheet' } : parameters;
  return z.union([
    getSpreadsheetSchema({ ...helpers, parameters: effectiveParams }),
    getSheetSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};