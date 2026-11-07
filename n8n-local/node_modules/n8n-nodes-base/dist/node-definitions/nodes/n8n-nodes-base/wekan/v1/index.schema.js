/**
 * Wekan Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getBoardSchema = require('./resource_board/index.schema');
const getCardSchema = require('./resource_card/index.schema');
const getCardCommentSchema = require('./resource_card_comment/index.schema');
const getChecklistSchema = require('./resource_checklist/index.schema');
const getChecklistItemSchema = require('./resource_checklist_item/index.schema');
const getListSchema = require('./resource_list/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'card' } : parameters;
  return z.union([
    getBoardSchema({ ...helpers, parameters: effectiveParams }),
    getCardSchema({ ...helpers, parameters: effectiveParams }),
    getCardCommentSchema({ ...helpers, parameters: effectiveParams }),
    getChecklistSchema({ ...helpers, parameters: effectiveParams }),
    getChecklistItemSchema({ ...helpers, parameters: effectiveParams }),
    getListSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};