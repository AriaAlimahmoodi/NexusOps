/**
 * Gmail Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getDraftSchema = require('./resource_draft/index.schema');
const getLabelSchema = require('./resource_label/index.schema');
const getMessageSchema = require('./resource_message/index.schema');
const getMessageLabelSchema = require('./resource_message_label/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'draft' } : parameters;
  return z.union([
    getDraftSchema({ ...helpers, parameters: effectiveParams }),
    getLabelSchema({ ...helpers, parameters: effectiveParams }),
    getMessageSchema({ ...helpers, parameters: effectiveParams }),
    getMessageLabelSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};