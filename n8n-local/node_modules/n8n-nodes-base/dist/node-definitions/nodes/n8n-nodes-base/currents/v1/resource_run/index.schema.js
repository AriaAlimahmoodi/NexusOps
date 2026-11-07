/**
 * Currents - Run Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCancelSchema = require('./operation_cancel.schema');
const getCancelGithubSchema = require('./operation_cancel_github.schema');
const getDeleteSchema = require('./operation_delete.schema');
const getFindSchema = require('./operation_find.schema');
const getGetSchema = require('./operation_get.schema');
const getGetAllSchema = require('./operation_get_all.schema');
const getResetSchema = require('./operation_reset.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'getAll' } : parameters;
  return z.union([
    getCancelSchema({ ...helpers, parameters: effectiveParams }),
    getCancelGithubSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteSchema({ ...helpers, parameters: effectiveParams }),
    getFindSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getGetAllSchema({ ...helpers, parameters: effectiveParams }),
    getResetSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};