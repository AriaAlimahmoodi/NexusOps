/**
 * Notion Node - Version 2.1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getBlockSchema = require('./resource_block/index.schema');
const getDatabaseSchema = require('./resource_database/index.schema');
const getDatabasePageSchema = require('./resource_database_page/index.schema');
const getPageSchema = require('./resource_page/index.schema');
const getUserSchema = require('./resource_user/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'page' } : parameters;
  return z.union([
    getBlockSchema({ ...helpers, parameters: effectiveParams }),
    getDatabaseSchema({ ...helpers, parameters: effectiveParams }),
    getDatabasePageSchema({ ...helpers, parameters: effectiveParams }),
    getPageSchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};