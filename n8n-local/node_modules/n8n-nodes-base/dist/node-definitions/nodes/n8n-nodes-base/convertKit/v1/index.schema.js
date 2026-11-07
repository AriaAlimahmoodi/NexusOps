/**
 * ConvertKit Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCustomFieldSchema = require('./resource_custom_field/index.schema');
const getFormSchema = require('./resource_form/index.schema');
const getSequenceSchema = require('./resource_sequence/index.schema');
const getTagSchema = require('./resource_tag/index.schema');
const getTagSubscriberSchema = require('./resource_tag_subscriber/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'form' } : parameters;
  return z.union([
    getCustomFieldSchema({ ...helpers, parameters: effectiveParams }),
    getFormSchema({ ...helpers, parameters: effectiveParams }),
    getSequenceSchema({ ...helpers, parameters: effectiveParams }),
    getTagSchema({ ...helpers, parameters: effectiveParams }),
    getTagSubscriberSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};