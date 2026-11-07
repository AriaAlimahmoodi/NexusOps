/**
 * Mattermost - Channel Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAddUserSchema = require('./operation_add_user.schema');
const getCreateSchema = require('./operation_create.schema');
const getDeleteSchema = require('./operation_delete.schema');
const getMembersSchema = require('./operation_members.schema');
const getRestoreSchema = require('./operation_restore.schema');
const getSearchSchema = require('./operation_search.schema');
const getStatisticsSchema = require('./operation_statistics.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'create' } : parameters;
  return z.union([
    getAddUserSchema({ ...helpers, parameters: effectiveParams }),
    getCreateSchema({ ...helpers, parameters: effectiveParams }),
    getDeleteSchema({ ...helpers, parameters: effectiveParams }),
    getMembersSchema({ ...helpers, parameters: effectiveParams }),
    getRestoreSchema({ ...helpers, parameters: effectiveParams }),
    getSearchSchema({ ...helpers, parameters: effectiveParams }),
    getStatisticsSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};