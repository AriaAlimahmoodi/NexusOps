/**
 * n8n Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAuditSchema = require('./resource_audit/index.schema');
const getCredentialSchema = require('./resource_credential/index.schema');
const getExecutionSchema = require('./resource_execution/index.schema');
const getWorkflowSchema = require('./resource_workflow/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'workflow' } : parameters;
  return z.union([
    getAuditSchema({ ...helpers, parameters: effectiveParams }),
    getCredentialSchema({ ...helpers, parameters: effectiveParams }),
    getExecutionSchema({ ...helpers, parameters: effectiveParams }),
    getWorkflowSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};