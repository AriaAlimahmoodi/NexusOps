/**
 * QuickBooks Online Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getBillSchema = require('./resource_bill/index.schema');
const getCustomerSchema = require('./resource_customer/index.schema');
const getEmployeeSchema = require('./resource_employee/index.schema');
const getEstimateSchema = require('./resource_estimate/index.schema');
const getInvoiceSchema = require('./resource_invoice/index.schema');
const getItemSchema = require('./resource_item/index.schema');
const getPaymentSchema = require('./resource_payment/index.schema');
const getPurchaseSchema = require('./resource_purchase/index.schema');
const getTransactionSchema = require('./resource_transaction/index.schema');
const getVendorSchema = require('./resource_vendor/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'customer' } : parameters;
  return z.union([
    getBillSchema({ ...helpers, parameters: effectiveParams }),
    getCustomerSchema({ ...helpers, parameters: effectiveParams }),
    getEmployeeSchema({ ...helpers, parameters: effectiveParams }),
    getEstimateSchema({ ...helpers, parameters: effectiveParams }),
    getInvoiceSchema({ ...helpers, parameters: effectiveParams }),
    getItemSchema({ ...helpers, parameters: effectiveParams }),
    getPaymentSchema({ ...helpers, parameters: effectiveParams }),
    getPurchaseSchema({ ...helpers, parameters: effectiveParams }),
    getTransactionSchema({ ...helpers, parameters: effectiveParams }),
    getVendorSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};