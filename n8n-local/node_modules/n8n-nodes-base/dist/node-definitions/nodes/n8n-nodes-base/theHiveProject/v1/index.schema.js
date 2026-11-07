/**
 * TheHive 5 Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAlertSchema = require('./resource_alert/index.schema');
const getCaseSchema = require('./resource_case/index.schema');
const getCommentSchema = require('./resource_comment/index.schema');
const getObservableSchema = require('./resource_observable/index.schema');
const getPageSchema = require('./resource_page/index.schema');
const getQuerySchema = require('./resource_query/index.schema');
const getTaskSchema = require('./resource_task/index.schema');
const getLogSchema = require('./resource_log/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'alert' } : parameters;
  return z.union([
    getAlertSchema({ ...helpers, parameters: effectiveParams }),
    getCaseSchema({ ...helpers, parameters: effectiveParams }),
    getCommentSchema({ ...helpers, parameters: effectiveParams }),
    getObservableSchema({ ...helpers, parameters: effectiveParams }),
    getPageSchema({ ...helpers, parameters: effectiveParams }),
    getQuerySchema({ ...helpers, parameters: effectiveParams }),
    getTaskSchema({ ...helpers, parameters: effectiveParams }),
    getLogSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};