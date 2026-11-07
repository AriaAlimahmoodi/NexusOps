/**
 * Venafi TLS Protect Cloud - Certificate Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getDeleteSchema = require('./operation_delete.schema');
const getDownloadSchema = require('./operation_download.schema');
const getGetSchema = require('./operation_get.schema');
const getGetManySchema = require('./operation_get_many.schema');
const getRenewSchema = require('./operation_renew.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'delete' } : parameters;
  return z.union([
    getDeleteSchema({ ...helpers, parameters: effectiveParams }),
    getDownloadSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getGetManySchema({ ...helpers, parameters: effectiveParams }),
    getRenewSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};