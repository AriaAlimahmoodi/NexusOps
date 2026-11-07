/**
 * Wise Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAccountSchema = require('./resource_account/index.schema');
const getExchangeRateSchema = require('./resource_exchange_rate/index.schema');
const getProfileSchema = require('./resource_profile/index.schema');
const getQuoteSchema = require('./resource_quote/index.schema');
const getRecipientSchema = require('./resource_recipient/index.schema');
const getTransferSchema = require('./resource_transfer/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'account' } : parameters;
  return z.union([
    getAccountSchema({ ...helpers, parameters: effectiveParams }),
    getExchangeRateSchema({ ...helpers, parameters: effectiveParams }),
    getProfileSchema({ ...helpers, parameters: effectiveParams }),
    getQuoteSchema({ ...helpers, parameters: effectiveParams }),
    getRecipientSchema({ ...helpers, parameters: effectiveParams }),
    getTransferSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};