/**
 * Paddle Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCouponSchema = require('./resource_coupon/index.schema');
const getPaymentSchema = require('./resource_payment/index.schema');
const getPlanSchema = require('./resource_plan/index.schema');
const getProductSchema = require('./resource_product/index.schema');
const getUserSchema = require('./resource_user/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'coupon' } : parameters;
  return z.union([
    getCouponSchema({ ...helpers, parameters: effectiveParams }),
    getPaymentSchema({ ...helpers, parameters: effectiveParams }),
    getPlanSchema({ ...helpers, parameters: effectiveParams }),
    getProductSchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};