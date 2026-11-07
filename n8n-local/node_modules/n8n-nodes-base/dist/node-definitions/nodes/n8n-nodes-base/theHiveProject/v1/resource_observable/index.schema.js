/**
 * TheHive 5 - Observable Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCreateSchema = require('./operation_create.schema');
const getDeleteObservableSchema = require('./operation_delete_observable.schema');
const getExecuteAnalyzerSchema = require('./operation_execute_analyzer.schema');
const getExecuteResponderSchema = require('./operation_execute_responder.schema');
const getGetSchema = require('./operation_get.schema');
const getSearchSchema = require('./operation_search.schema');
const getUpdateSchema = require('./operation_update.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'create' } : parameters;
  return z.union([
    getCreateSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteObservableSchema({ ...helpers, parameters: effectiveParams }),
    getExecuteAnalyzerSchema({ ...helpers, parameters: effectiveParams }),
    getExecuteResponderSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getSearchSchema({ ...helpers, parameters: effectiveParams }),
    getUpdateSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};