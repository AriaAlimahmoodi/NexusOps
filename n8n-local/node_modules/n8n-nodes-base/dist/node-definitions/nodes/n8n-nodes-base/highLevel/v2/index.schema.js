/**
 * HighLevel Node - Version 2 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getContactSchema = require('./resource_contact/index.schema');
const getOpportunitySchema = require('./resource_opportunity/index.schema');
const getTaskSchema = require('./resource_task/index.schema');
const getCalendarSchema = require('./resource_calendar/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'contact' } : parameters;
  return z.union([
    getContactSchema({ ...helpers, parameters: effectiveParams }),
    getOpportunitySchema({ ...helpers, parameters: effectiveParams }),
    getTaskSchema({ ...helpers, parameters: effectiveParams }),
    getCalendarSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};