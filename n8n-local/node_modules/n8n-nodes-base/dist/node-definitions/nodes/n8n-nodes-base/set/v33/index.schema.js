/**
 * Edit Fields (Set) Node - Version 3.3 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getManualSchema = require('./mode_manual.schema');
const getRawSchema = require('./mode_raw.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.mode === undefined ? { ...parameters, mode: 'manual' } : parameters;
  return z.union([
    getManualSchema({ ...helpers, parameters: effectiveParams }),
    getRawSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};