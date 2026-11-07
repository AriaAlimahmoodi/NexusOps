/**
 * Stripe Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getBalanceSchema = require('./resource_balance/index.schema');
const getChargeSchema = require('./resource_charge/index.schema');
const getCouponSchema = require('./resource_coupon/index.schema');
const getCustomerSchema = require('./resource_customer/index.schema');
const getCustomerCardSchema = require('./resource_customer_card/index.schema');
const getMeterEventSchema = require('./resource_meter_event/index.schema');
const getSourceSchema = require('./resource_source/index.schema');
const getTokenSchema = require('./resource_token/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'balance' } : parameters;
  return z.union([
    getBalanceSchema({ ...helpers, parameters: effectiveParams }),
    getChargeSchema({ ...helpers, parameters: effectiveParams }),
    getCouponSchema({ ...helpers, parameters: effectiveParams }),
    getCustomerSchema({ ...helpers, parameters: effectiveParams }),
    getCustomerCardSchema({ ...helpers, parameters: effectiveParams }),
    getMeterEventSchema({ ...helpers, parameters: effectiveParams }),
    getSourceSchema({ ...helpers, parameters: effectiveParams }),
    getTokenSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};