/**
 * Slack - Channel Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getArchiveSchema = require('./operation_archive.schema');
const getCloseSchema = require('./operation_close.schema');
const getCreateSchema = require('./operation_create.schema');
const getGetSchema = require('./operation_get.schema');
const getGetAllSchema = require('./operation_get_all.schema');
const getHistorySchema = require('./operation_history.schema');
const getInviteSchema = require('./operation_invite.schema');
const getJoinSchema = require('./operation_join.schema');
const getKickSchema = require('./operation_kick.schema');
const getLeaveSchema = require('./operation_leave.schema');
const getMemberSchema = require('./operation_member.schema');
const getOpenSchema = require('./operation_open.schema');
const getRenameSchema = require('./operation_rename.schema');
const getRepliesSchema = require('./operation_replies.schema');
const getSetPurposeSchema = require('./operation_set_purpose.schema');
const getSetTopicSchema = require('./operation_set_topic.schema');
const getUnarchiveSchema = require('./operation_unarchive.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'create' } : parameters;
  return z.union([
    getArchiveSchema({ ...helpers, parameters: effectiveParams }),
    getCloseSchema({ ...helpers, parameters: effectiveParams }),
    getCreateSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getGetAllSchema({ ...helpers, parameters: effectiveParams }),
    getHistorySchema({ ...helpers, parameters: effectiveParams }),
    getInviteSchema({ ...helpers, parameters: effectiveParams }),
    getJoinSchema({ ...helpers, parameters: effectiveParams }),
    getKickSchema({ ...helpers, parameters: effectiveParams }),
    getLeaveSchema({ ...helpers, parameters: effectiveParams }),
    getMemberSchema({ ...helpers, parameters: effectiveParams }),
    getOpenSchema({ ...helpers, parameters: effectiveParams }),
    getRenameSchema({ ...helpers, parameters: effectiveParams }),
    getRepliesSchema({ ...helpers, parameters: effectiveParams }),
    getSetPurposeSchema({ ...helpers, parameters: effectiveParams }),
    getSetTopicSchema({ ...helpers, parameters: effectiveParams }),
    getUnarchiveSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};