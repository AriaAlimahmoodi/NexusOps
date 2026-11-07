/**
 * Demio Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getEventSchema = require('./resource_event/index.schema');
const getReportSchema = require('./resource_report/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'event' } : parameters;
  return z.union([
    getEventSchema({ ...helpers, parameters: effectiveParams }),
    getReportSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};