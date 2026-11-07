/**
 * PagerDuty Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getIncidentSchema = require('./resource_incident/index.schema');
const getIncidentNoteSchema = require('./resource_incident_note/index.schema');
const getLogEntrySchema = require('./resource_log_entry/index.schema');
const getUserSchema = require('./resource_user/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'incident' } : parameters;
  return z.union([
    getIncidentSchema({ ...helpers, parameters: effectiveParams }),
    getIncidentNoteSchema({ ...helpers, parameters: effectiveParams }),
    getLogEntrySchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};