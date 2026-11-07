/**
 * Harvest - TimeEntry Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCreateByDurationSchema = require('./operation_create_by_duration.schema');
const getCreateByStartEndSchema = require('./operation_create_by_start_end.schema');
const getDeleteSchema = require('./operation_delete.schema');
const getDeleteExternalSchema = require('./operation_delete_external.schema');
const getGetSchema = require('./operation_get.schema');
const getGetAllSchema = require('./operation_get_all.schema');
const getRestartTimeSchema = require('./operation_restart_time.schema');
const getStopTimeSchema = require('./operation_stop_time.schema');
const getUpdateSchema = require('./operation_update.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'getAll' } : parameters;
  return z.union([
    getCreateByDurationSchema({ ...helpers, parameters: effectiveParams }),
    getCreateByStartEndSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteExternalSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getGetAllSchema({ ...helpers, parameters: effectiveParams }),
    getRestartTimeSchema({ ...helpers, parameters: effectiveParams }),
    getStopTimeSchema({ ...helpers, parameters: effectiveParams }),
    getUpdateSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};