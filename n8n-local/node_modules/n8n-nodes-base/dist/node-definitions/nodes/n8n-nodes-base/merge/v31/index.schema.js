/**
 * Merge Node - Version 3.1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAppendSchema = require('./mode_append.schema');
const getChooseBranchSchema = require('./mode_choose_branch.schema');
const getCombineSchema = require('./mode_combine.schema');
const getCombineBySqlSchema = require('./mode_combine_by_sql.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.mode === undefined ? { ...parameters, mode: 'append' } : parameters;
  return z.union([
    getAppendSchema({ ...helpers, parameters: effectiveParams }),
    getChooseBranchSchema({ ...helpers, parameters: effectiveParams }),
    getCombineSchema({ ...helpers, parameters: effectiveParams }),
    getCombineBySqlSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};