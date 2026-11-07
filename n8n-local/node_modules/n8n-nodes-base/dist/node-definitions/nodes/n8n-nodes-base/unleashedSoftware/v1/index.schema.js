/**
 * Unleashed Software Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getSalesOrderSchema = require('./resource_sales_order/index.schema');
const getStockOnHandSchema = require('./resource_stock_on_hand/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'salesOrder' } : parameters;
  return z.union([
    getSalesOrderSchema({ ...helpers, parameters: effectiveParams }),
    getStockOnHandSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};