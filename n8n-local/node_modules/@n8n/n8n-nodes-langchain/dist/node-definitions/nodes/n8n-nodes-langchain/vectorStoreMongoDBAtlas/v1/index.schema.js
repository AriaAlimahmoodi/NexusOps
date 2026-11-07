/**
 * MongoDB Atlas Vector Store Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getInsertSchema = require('./mode_insert.schema');
const getLoadSchema = require('./mode_load.schema');
const getRetrieveSchema = require('./mode_retrieve.schema');
const getRetrieveAsToolSchema = require('./mode_retrieve_as_tool.schema');
const getUpdateSchema = require('./mode_update.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.mode === undefined ? { ...parameters, mode: 'retrieve' } : parameters;
  return z.union([
    getInsertSchema({ ...helpers, parameters: effectiveParams }),
    getLoadSchema({ ...helpers, parameters: effectiveParams }),
    getRetrieveSchema({ ...helpers, parameters: effectiveParams }),
    getRetrieveAsToolSchema({ ...helpers, parameters: effectiveParams }),
    getUpdateSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};