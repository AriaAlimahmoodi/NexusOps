/**
 * Microsoft Graph Security Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getSecureScoreSchema = require('./resource_secure_score/index.schema');
const getSecureScoreControlProfileSchema = require('./resource_secure_score_control_profile/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'secureScore' } : parameters;
  return z.union([
    getSecureScoreSchema({ ...helpers, parameters: effectiveParams }),
    getSecureScoreControlProfileSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};