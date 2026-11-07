/**
 * Switch Node - Version 3.2 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getExpressionSchema = require('./mode_expression.schema');
const getRulesSchema = require('./mode_rules.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.mode === undefined ? { ...parameters, mode: 'rules' } : parameters;
  return z.union([
    getExpressionSchema({ ...helpers, parameters: effectiveParams }),
    getRulesSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};