/**
 * Zendesk Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getTicketSchema = require('./resource_ticket/index.schema');
const getTicketFieldSchema = require('./resource_ticket_field/index.schema');
const getUserSchema = require('./resource_user/index.schema');
const getOrganizationSchema = require('./resource_organization/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'ticket' } : parameters;
  return z.union([
    getTicketSchema({ ...helpers, parameters: effectiveParams }),
    getTicketFieldSchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
    getOrganizationSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};