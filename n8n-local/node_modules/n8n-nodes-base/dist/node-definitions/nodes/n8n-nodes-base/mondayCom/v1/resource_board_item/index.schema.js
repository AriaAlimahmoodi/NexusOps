/**
 * Monday.com - BoardItem Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAddUpdateSchema = require('./operation_add_update.schema');
const getChangeColumnValueSchema = require('./operation_change_column_value.schema');
const getChangeMultipleColumnValuesSchema = require('./operation_change_multiple_column_values.schema');
const getCreateSchema = require('./operation_create.schema');
const getDeleteSchema = require('./operation_delete.schema');
const getGetSchema = require('./operation_get.schema');
const getGetAllSchema = require('./operation_get_all.schema');
const getGetByColumnValueSchema = require('./operation_get_by_column_value.schema');
const getMoveSchema = require('./operation_move.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'create' } : parameters;
  return z.union([
    getAddUpdateSchema({ ...helpers, parameters: effectiveParams }),
    getChangeColumnValueSchema({ ...helpers, parameters: effectiveParams }),
    getChangeMultipleColumnValuesSchema({ ...helpers, parameters: effectiveParams }),
    getCreateSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getGetAllSchema({ ...helpers, parameters: effectiveParams }),
    getGetByColumnValueSchema({ ...helpers, parameters: effectiveParams }),
    getMoveSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};