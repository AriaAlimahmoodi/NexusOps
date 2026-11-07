/**
 * Mailjet Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getEmailSchema = require('./resource_email/index.schema');
const getSmsSchema = require('./resource_sms/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'email' } : parameters;
  return z.union([
    getEmailSchema({ ...helpers, parameters: effectiveParams }),
    getSmsSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};