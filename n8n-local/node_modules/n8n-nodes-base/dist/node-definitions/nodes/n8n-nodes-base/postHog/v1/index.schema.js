/**
 * PostHog Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAliasSchema = require('./resource_alias/index.schema');
const getEventSchema = require('./resource_event/index.schema');
const getIdentitySchema = require('./resource_identity/index.schema');
const getTrackSchema = require('./resource_track/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'event' } : parameters;
  return z.union([
    getAliasSchema({ ...helpers, parameters: effectiveParams }),
    getEventSchema({ ...helpers, parameters: effectiveParams }),
    getIdentitySchema({ ...helpers, parameters: effectiveParams }),
    getTrackSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};