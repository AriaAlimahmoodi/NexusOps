/**
 * HaloPSA Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getClientSchema = require('./resource_client/index.schema');
const getSiteSchema = require('./resource_site/index.schema');
const getTicketSchema = require('./resource_ticket/index.schema');
const getUserSchema = require('./resource_user/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'client' } : parameters;
  return z.union([
    getClientSchema({ ...helpers, parameters: effectiveParams }),
    getSiteSchema({ ...helpers, parameters: effectiveParams }),
    getTicketSchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};