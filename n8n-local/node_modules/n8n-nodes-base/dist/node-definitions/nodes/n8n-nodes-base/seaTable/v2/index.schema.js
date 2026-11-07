/**
 * SeaTable Node - Version 2 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getRowSchema = require('./resource_row/index.schema');
const getBaseSchema = require('./resource_base/index.schema');
const getLinkSchema = require('./resource_link/index.schema');
const getAssetSchema = require('./resource_asset/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'row' } : parameters;
  return z.union([
    getRowSchema({ ...helpers, parameters: effectiveParams }),
    getBaseSchema({ ...helpers, parameters: effectiveParams }),
    getLinkSchema({ ...helpers, parameters: effectiveParams }),
    getAssetSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};