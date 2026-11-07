/**
 * Elastic Security Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCaseSchema = require('./resource_case/index.schema');
const getCaseCommentSchema = require('./resource_case_comment/index.schema');
const getCaseTagSchema = require('./resource_case_tag/index.schema');
const getConnectorSchema = require('./resource_connector/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'case' } : parameters;
  return z.union([
    getCaseSchema({ ...helpers, parameters: effectiveParams }),
    getCaseCommentSchema({ ...helpers, parameters: effectiveParams }),
    getCaseTagSchema({ ...helpers, parameters: effectiveParams }),
    getConnectorSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};