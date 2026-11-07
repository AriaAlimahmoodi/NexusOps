/**
 * Mocean Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getSmsSchema = require('./resource_sms/index.schema');
const getVoiceSchema = require('./resource_voice/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'sms' } : parameters;
  return z.union([
    getSmsSchema({ ...helpers, parameters: effectiveParams }),
    getVoiceSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};