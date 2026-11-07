/**
 * MongoDB - Document Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAggregateSchema = require('./operation_aggregate.schema');
const getDeleteSchema = require('./operation_delete.schema');
const getFindSchema = require('./operation_find.schema');
const getFindOneAndReplaceSchema = require('./operation_find_one_and_replace.schema');
const getFindOneAndUpdateSchema = require('./operation_find_one_and_update.schema');
const getInsertSchema = require('./operation_insert.schema');
const getUpdateSchema = require('./operation_update.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'find' } : parameters;
  return z.union([
    getAggregateSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteSchema({ ...helpers, parameters: effectiveParams }),
    getFindSchema({ ...helpers, parameters: effectiveParams }),
    getFindOneAndReplaceSchema({ ...helpers, parameters: effectiveParams }),
    getFindOneAndUpdateSchema({ ...helpers, parameters: effectiveParams }),
    getInsertSchema({ ...helpers, parameters: effectiveParams }),
    getUpdateSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};