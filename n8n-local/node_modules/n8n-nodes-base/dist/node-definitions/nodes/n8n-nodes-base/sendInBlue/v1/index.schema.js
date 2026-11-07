/**
 * Brevo Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getContactSchema = require('./resource_contact/index.schema');
const getAttributeSchema = require('./resource_attribute/index.schema');
const getEmailSchema = require('./resource_email/index.schema');
const getSenderSchema = require('./resource_sender/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'email' } : parameters;
  return z.union([
    getContactSchema({ ...helpers, parameters: effectiveParams }),
    getAttributeSchema({ ...helpers, parameters: effectiveParams }),
    getEmailSchema({ ...helpers, parameters: effectiveParams }),
    getSenderSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};