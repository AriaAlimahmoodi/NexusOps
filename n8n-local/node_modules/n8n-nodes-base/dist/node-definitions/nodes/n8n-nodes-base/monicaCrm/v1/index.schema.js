/**
 * Monica CRM Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getActivitySchema = require('./resource_activity/index.schema');
const getCallSchema = require('./resource_call/index.schema');
const getContactSchema = require('./resource_contact/index.schema');
const getContactFieldSchema = require('./resource_contact_field/index.schema');
const getContactTagSchema = require('./resource_contact_tag/index.schema');
const getConversationSchema = require('./resource_conversation/index.schema');
const getConversationMessageSchema = require('./resource_conversation_message/index.schema');
const getJournalEntrySchema = require('./resource_journal_entry/index.schema');
const getNoteSchema = require('./resource_note/index.schema');
const getReminderSchema = require('./resource_reminder/index.schema');
const getTagSchema = require('./resource_tag/index.schema');
const getTaskSchema = require('./resource_task/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'contact' } : parameters;
  return z.union([
    getActivitySchema({ ...helpers, parameters: effectiveParams }),
    getCallSchema({ ...helpers, parameters: effectiveParams }),
    getContactSchema({ ...helpers, parameters: effectiveParams }),
    getContactFieldSchema({ ...helpers, parameters: effectiveParams }),
    getContactTagSchema({ ...helpers, parameters: effectiveParams }),
    getConversationSchema({ ...helpers, parameters: effectiveParams }),
    getConversationMessageSchema({ ...helpers, parameters: effectiveParams }),
    getJournalEntrySchema({ ...helpers, parameters: effectiveParams }),
    getNoteSchema({ ...helpers, parameters: effectiveParams }),
    getReminderSchema({ ...helpers, parameters: effectiveParams }),
    getTagSchema({ ...helpers, parameters: effectiveParams }),
    getTaskSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};