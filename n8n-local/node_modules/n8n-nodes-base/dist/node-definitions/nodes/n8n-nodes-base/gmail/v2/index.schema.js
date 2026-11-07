/**
 * Gmail Node - Version 2 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getMessageSchema = require('./resource_message/index.schema');
const getLabelSchema = require('./resource_label/index.schema');
const getDraftSchema = require('./resource_draft/index.schema');
const getThreadSchema = require('./resource_thread/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'message' } : parameters;
  return z.union([
    getMessageSchema({ ...helpers, parameters: effectiveParams }),
    getLabelSchema({ ...helpers, parameters: effectiveParams }),
    getDraftSchema({ ...helpers, parameters: effectiveParams }),
    getThreadSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};