/**
 * Magento 2 Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCustomerSchema = require('./resource_customer/index.schema');
const getInvoiceSchema = require('./resource_invoice/index.schema');
const getOrderSchema = require('./resource_order/index.schema');
const getProductSchema = require('./resource_product/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'customer' } : parameters;
  return z.union([
    getCustomerSchema({ ...helpers, parameters: effectiveParams }),
    getInvoiceSchema({ ...helpers, parameters: effectiveParams }),
    getOrderSchema({ ...helpers, parameters: effectiveParams }),
    getProductSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};