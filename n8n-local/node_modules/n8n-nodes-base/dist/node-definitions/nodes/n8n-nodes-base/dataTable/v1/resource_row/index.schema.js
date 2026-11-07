/**
 * Data table - Row Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getDeleteRowsSchema = require('./operation_delete_rows.schema');
const getGetSchema = require('./operation_get.schema');
const getInsertSchema = require('./operation_insert.schema');
const getRowExistsSchema = require('./operation_row_exists.schema');
const getRowNotExistsSchema = require('./operation_row_not_exists.schema');
const getUpdateSchema = require('./operation_update.schema');
const getUpsertSchema = require('./operation_upsert.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'insert' } : parameters;
  return z.union([
    getDeleteRowsSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getInsertSchema({ ...helpers, parameters: effectiveParams }),
    getRowExistsSchema({ ...helpers, parameters: effectiveParams }),
    getRowNotExistsSchema({ ...helpers, parameters: effectiveParams }),
    getUpdateSchema({ ...helpers, parameters: effectiveParams }),
    getUpsertSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};