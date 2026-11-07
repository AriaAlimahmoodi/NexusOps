/**
 * Wise - Account Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getGetBalancesSchema = require('./operation_get_balances.schema');
const getGetCurrenciesSchema = require('./operation_get_currencies.schema');
const getGetStatementSchema = require('./operation_get_statement.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'getBalances' } : parameters;
  return z.union([
    getGetBalancesSchema({ ...helpers, parameters: effectiveParams }),
    getGetCurrenciesSchema({ ...helpers, parameters: effectiveParams }),
    getGetStatementSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};