/**
 * Marketstack Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getEndOfDayDataSchema = require('./resource_end_of_day_data/index.schema');
const getExchangeSchema = require('./resource_exchange/index.schema');
const getTickerSchema = require('./resource_ticker/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'endOfDayData' } : parameters;
  return z.union([
    getEndOfDayDataSchema({ ...helpers, parameters: effectiveParams }),
    getExchangeSchema({ ...helpers, parameters: effectiveParams }),
    getTickerSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};