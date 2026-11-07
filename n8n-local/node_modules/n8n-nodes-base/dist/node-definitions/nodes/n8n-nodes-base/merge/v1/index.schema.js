/**
 * Merge Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAppendSchema = require('./mode_append.schema');
const getKeepKeyMatchesSchema = require('./mode_keep_key_matches.schema');
const getMergeByIndexSchema = require('./mode_merge_by_index.schema');
const getMergeByKeySchema = require('./mode_merge_by_key.schema');
const getMultiplexSchema = require('./mode_multiplex.schema');
const getPassThroughSchema = require('./mode_pass_through.schema');
const getRemoveKeyMatchesSchema = require('./mode_remove_key_matches.schema');
const getWaitSchema = require('./mode_wait.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.mode === undefined ? { ...parameters, mode: 'append' } : parameters;
  return z.union([
    getAppendSchema({ ...helpers, parameters: effectiveParams }),
    getKeepKeyMatchesSchema({ ...helpers, parameters: effectiveParams }),
    getMergeByIndexSchema({ ...helpers, parameters: effectiveParams }),
    getMergeByKeySchema({ ...helpers, parameters: effectiveParams }),
    getMultiplexSchema({ ...helpers, parameters: effectiveParams }),
    getPassThroughSchema({ ...helpers, parameters: effectiveParams }),
    getRemoveKeyMatchesSchema({ ...helpers, parameters: effectiveParams }),
    getWaitSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};