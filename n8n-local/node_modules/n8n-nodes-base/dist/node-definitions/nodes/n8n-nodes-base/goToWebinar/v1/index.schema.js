/**
 * GoToWebinar Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAttendeeSchema = require('./resource_attendee/index.schema');
const getCoorganizerSchema = require('./resource_coorganizer/index.schema');
const getPanelistSchema = require('./resource_panelist/index.schema');
const getRegistrantSchema = require('./resource_registrant/index.schema');
const getSessionSchema = require('./resource_session/index.schema');
const getWebinarSchema = require('./resource_webinar/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'attendee' } : parameters;
  return z.union([
    getAttendeeSchema({ ...helpers, parameters: effectiveParams }),
    getCoorganizerSchema({ ...helpers, parameters: effectiveParams }),
    getPanelistSchema({ ...helpers, parameters: effectiveParams }),
    getRegistrantSchema({ ...helpers, parameters: effectiveParams }),
    getSessionSchema({ ...helpers, parameters: effectiveParams }),
    getWebinarSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};