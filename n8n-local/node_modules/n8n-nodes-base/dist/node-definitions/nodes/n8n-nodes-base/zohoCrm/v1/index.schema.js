/**
 * Zoho CRM Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAccountSchema = require('./resource_account/index.schema');
const getContactSchema = require('./resource_contact/index.schema');
const getDealSchema = require('./resource_deal/index.schema');
const getInvoiceSchema = require('./resource_invoice/index.schema');
const getLeadSchema = require('./resource_lead/index.schema');
const getProductSchema = require('./resource_product/index.schema');
const getPurchaseOrderSchema = require('./resource_purchase_order/index.schema');
const getQuoteSchema = require('./resource_quote/index.schema');
const getSalesOrderSchema = require('./resource_sales_order/index.schema');
const getVendorSchema = require('./resource_vendor/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'account' } : parameters;
  return z.union([
    getAccountSchema({ ...helpers, parameters: effectiveParams }),
    getContactSchema({ ...helpers, parameters: effectiveParams }),
    getDealSchema({ ...helpers, parameters: effectiveParams }),
    getInvoiceSchema({ ...helpers, parameters: effectiveParams }),
    getLeadSchema({ ...helpers, parameters: effectiveParams }),
    getProductSchema({ ...helpers, parameters: effectiveParams }),
    getPurchaseOrderSchema({ ...helpers, parameters: effectiveParams }),
    getQuoteSchema({ ...helpers, parameters: effectiveParams }),
    getSalesOrderSchema({ ...helpers, parameters: effectiveParams }),
    getVendorSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};