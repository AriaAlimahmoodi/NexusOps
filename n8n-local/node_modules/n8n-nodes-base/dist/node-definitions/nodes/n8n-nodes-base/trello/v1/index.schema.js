/**
 * Trello Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAttachmentSchema = require('./resource_attachment/index.schema');
const getBoardSchema = require('./resource_board/index.schema');
const getBoardMemberSchema = require('./resource_board_member/index.schema');
const getCardSchema = require('./resource_card/index.schema');
const getCardCommentSchema = require('./resource_card_comment/index.schema');
const getChecklistSchema = require('./resource_checklist/index.schema');
const getLabelSchema = require('./resource_label/index.schema');
const getListSchema = require('./resource_list/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'card' } : parameters;
  return z.union([
    getAttachmentSchema({ ...helpers, parameters: effectiveParams }),
    getBoardSchema({ ...helpers, parameters: effectiveParams }),
    getBoardMemberSchema({ ...helpers, parameters: effectiveParams }),
    getCardSchema({ ...helpers, parameters: effectiveParams }),
    getCardCommentSchema({ ...helpers, parameters: effectiveParams }),
    getChecklistSchema({ ...helpers, parameters: effectiveParams }),
    getLabelSchema({ ...helpers, parameters: effectiveParams }),
    getListSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};