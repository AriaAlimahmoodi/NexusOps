/**
 * Metabase - Databases Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAddNewDatasourceSchema = require('./operation_add_new_datasource.schema');
const getGetAllSchema = require('./operation_get_all.schema');
const getGetFieldsSchema = require('./operation_get_fields.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'getAll' } : parameters;
  return z.union([
    getAddNewDatasourceSchema({ ...helpers, parameters: effectiveParams }),
    getGetAllSchema({ ...helpers, parameters: effectiveParams }),
    getGetFieldsSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};