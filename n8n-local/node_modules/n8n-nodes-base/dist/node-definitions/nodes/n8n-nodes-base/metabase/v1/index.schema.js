/**
 * Metabase Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAlertsSchema = require('./resource_alerts/index.schema');
const getDatabasesSchema = require('./resource_databases/index.schema');
const getMetricsSchema = require('./resource_metrics/index.schema');
const getQuestionsSchema = require('./resource_questions/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'questions' } : parameters;
  return z.union([
    getAlertsSchema({ ...helpers, parameters: effectiveParams }),
    getDatabasesSchema({ ...helpers, parameters: effectiveParams }),
    getMetricsSchema({ ...helpers, parameters: effectiveParams }),
    getQuestionsSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};