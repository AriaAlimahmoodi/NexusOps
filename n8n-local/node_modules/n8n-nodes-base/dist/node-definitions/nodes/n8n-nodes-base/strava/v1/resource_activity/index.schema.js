/**
 * Strava - Activity Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCreateSchema = require('./operation_create.schema');
const getGetSchema = require('./operation_get.schema');
const getGetAllSchema = require('./operation_get_all.schema');
const getGetCommentsSchema = require('./operation_get_comments.schema');
const getGetKudosSchema = require('./operation_get_kudos.schema');
const getGetLapsSchema = require('./operation_get_laps.schema');
const getGetStreamsSchema = require('./operation_get_streams.schema');
const getGetZonesSchema = require('./operation_get_zones.schema');
const getUpdateSchema = require('./operation_update.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'create' } : parameters;
  return z.union([
    getCreateSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getGetAllSchema({ ...helpers, parameters: effectiveParams }),
    getGetCommentsSchema({ ...helpers, parameters: effectiveParams }),
    getGetKudosSchema({ ...helpers, parameters: effectiveParams }),
    getGetLapsSchema({ ...helpers, parameters: effectiveParams }),
    getGetStreamsSchema({ ...helpers, parameters: effectiveParams }),
    getGetZonesSchema({ ...helpers, parameters: effectiveParams }),
    getUpdateSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};