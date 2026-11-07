/**
 * Currents Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getActionSchema = require('./resource_action/index.schema');
const getInstanceSchema = require('./resource_instance/index.schema');
const getProjectSchema = require('./resource_project/index.schema');
const getRunSchema = require('./resource_run/index.schema');
const getSignatureSchema = require('./resource_signature/index.schema');
const getSpecFileSchema = require('./resource_spec_file/index.schema');
const getTestSchema = require('./resource_test/index.schema');
const getTestResultSchema = require('./resource_test_result/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'run' } : parameters;
  return z.union([
    getActionSchema({ ...helpers, parameters: effectiveParams }),
    getInstanceSchema({ ...helpers, parameters: effectiveParams }),
    getProjectSchema({ ...helpers, parameters: effectiveParams }),
    getRunSchema({ ...helpers, parameters: effectiveParams }),
    getSignatureSchema({ ...helpers, parameters: effectiveParams }),
    getSpecFileSchema({ ...helpers, parameters: effectiveParams }),
    getTestSchema({ ...helpers, parameters: effectiveParams }),
    getTestResultSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};