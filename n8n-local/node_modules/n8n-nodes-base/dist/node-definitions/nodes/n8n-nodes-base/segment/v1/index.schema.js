/**
 * Segment Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getGroupSchema = require('./resource_group/index.schema');
const getIdentifySchema = require('./resource_identify/index.schema');
const getTrackSchema = require('./resource_track/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'identify' } : parameters;
  return z.union([
    getGroupSchema({ ...helpers, parameters: effectiveParams }),
    getIdentifySchema({ ...helpers, parameters: effectiveParams }),
    getTrackSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};