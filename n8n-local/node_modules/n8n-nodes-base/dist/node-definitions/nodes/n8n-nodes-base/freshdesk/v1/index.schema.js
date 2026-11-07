/**
 * Freshdesk Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getContactSchema = require('./resource_contact/index.schema');
const getTicketSchema = require('./resource_ticket/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'ticket' } : parameters;
  return z.union([
    getContactSchema({ ...helpers, parameters: effectiveParams }),
    getTicketSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};