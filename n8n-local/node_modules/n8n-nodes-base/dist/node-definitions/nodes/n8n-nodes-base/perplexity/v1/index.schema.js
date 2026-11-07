/**
 * Perplexity Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAgentSchema = require('./resource_agent/index.schema');
const getChatSchema = require('./resource_chat/index.schema');
const getEmbeddingSchema = require('./resource_embedding/index.schema');
const getSearchSchema = require('./resource_search/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'chat' } : parameters;
  return z.union([
    getAgentSchema({ ...helpers, parameters: effectiveParams }),
    getChatSchema({ ...helpers, parameters: effectiveParams }),
    getEmbeddingSchema({ ...helpers, parameters: effectiveParams }),
    getSearchSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};