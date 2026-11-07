/**
 * Keap Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCompanySchema = require('./resource_company/index.schema');
const getContactSchema = require('./resource_contact/index.schema');
const getContactNoteSchema = require('./resource_contact_note/index.schema');
const getContactTagSchema = require('./resource_contact_tag/index.schema');
const getEcommerceOrderSchema = require('./resource_ecommerce_order/index.schema');
const getEcommerceProductSchema = require('./resource_ecommerce_product/index.schema');
const getEmailSchema = require('./resource_email/index.schema');
const getFileSchema = require('./resource_file/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'company' } : parameters;
  return z.union([
    getCompanySchema({ ...helpers, parameters: effectiveParams }),
    getContactSchema({ ...helpers, parameters: effectiveParams }),
    getContactNoteSchema({ ...helpers, parameters: effectiveParams }),
    getContactTagSchema({ ...helpers, parameters: effectiveParams }),
    getEcommerceOrderSchema({ ...helpers, parameters: effectiveParams }),
    getEcommerceProductSchema({ ...helpers, parameters: effectiveParams }),
    getEmailSchema({ ...helpers, parameters: effectiveParams }),
    getFileSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};