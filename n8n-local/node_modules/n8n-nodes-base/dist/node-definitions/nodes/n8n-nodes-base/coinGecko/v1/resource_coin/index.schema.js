/**
 * CoinGecko - Coin Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCandlestickSchema = require('./operation_candlestick.schema');
const getGetSchema = require('./operation_get.schema');
const getGetAllSchema = require('./operation_get_all.schema');
const getHistorySchema = require('./operation_history.schema');
const getMarketSchema = require('./operation_market.schema');
const getMarketChartSchema = require('./operation_market_chart.schema');
const getPriceSchema = require('./operation_price.schema');
const getTickerSchema = require('./operation_ticker.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'getAll' } : parameters;
  return z.union([
    getCandlestickSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getGetAllSchema({ ...helpers, parameters: effectiveParams }),
    getHistorySchema({ ...helpers, parameters: effectiveParams }),
    getMarketSchema({ ...helpers, parameters: effectiveParams }),
    getMarketChartSchema({ ...helpers, parameters: effectiveParams }),
    getPriceSchema({ ...helpers, parameters: effectiveParams }),
    getTickerSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};