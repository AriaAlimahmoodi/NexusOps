/**
 * Monday.com Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getBoardSchema = require('./resource_board/index.schema');
const getBoardColumnSchema = require('./resource_board_column/index.schema');
const getBoardGroupSchema = require('./resource_board_group/index.schema');
const getBoardItemSchema = require('./resource_board_item/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'board' } : parameters;
  return z.union([
    getBoardSchema({ ...helpers, parameters: effectiveParams }),
    getBoardColumnSchema({ ...helpers, parameters: effectiveParams }),
    getBoardGroupSchema({ ...helpers, parameters: effectiveParams }),
    getBoardItemSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};