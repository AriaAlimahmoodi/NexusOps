/**
 * Emelia - Campaign Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAddContactSchema = require('./operation_add_contact.schema');
const getCreateSchema = require('./operation_create.schema');
const getDuplicateSchema = require('./operation_duplicate.schema');
const getGetSchema = require('./operation_get.schema');
const getGetAllSchema = require('./operation_get_all.schema');
const getPauseSchema = require('./operation_pause.schema');
const getStartSchema = require('./operation_start.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'get' } : parameters;
  return z.union([
    getAddContactSchema({ ...helpers, parameters: effectiveParams }),
    getCreateSchema({ ...helpers, parameters: effectiveParams }),
    getDuplicateSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getGetAllSchema({ ...helpers, parameters: effectiveParams }),
    getPauseSchema({ ...helpers, parameters: effectiveParams }),
    getStartSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};