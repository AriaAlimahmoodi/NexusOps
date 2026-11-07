/**
 * Invoice Ninja Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getBankTransactionSchema = require('./resource_bank_transaction/index.schema');
const getClientSchema = require('./resource_client/index.schema');
const getExpenseSchema = require('./resource_expense/index.schema');
const getInvoiceSchema = require('./resource_invoice/index.schema');
const getPaymentSchema = require('./resource_payment/index.schema');
const getQuoteSchema = require('./resource_quote/index.schema');
const getTaskSchema = require('./resource_task/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'client' } : parameters;
  return z.union([
    getBankTransactionSchema({ ...helpers, parameters: effectiveParams }),
    getClientSchema({ ...helpers, parameters: effectiveParams }),
    getExpenseSchema({ ...helpers, parameters: effectiveParams }),
    getInvoiceSchema({ ...helpers, parameters: effectiveParams }),
    getPaymentSchema({ ...helpers, parameters: effectiveParams }),
    getQuoteSchema({ ...helpers, parameters: effectiveParams }),
    getTaskSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};