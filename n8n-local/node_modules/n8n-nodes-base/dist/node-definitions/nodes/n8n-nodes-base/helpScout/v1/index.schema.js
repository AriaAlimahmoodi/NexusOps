/**
 * Help Scout Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getConversationSchema = require('./resource_conversation/index.schema');
const getCustomerSchema = require('./resource_customer/index.schema');
const getMailboxSchema = require('./resource_mailbox/index.schema');
const getThreadSchema = require('./resource_thread/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'conversation' } : parameters;
  return z.union([
    getConversationSchema({ ...helpers, parameters: effectiveParams }),
    getCustomerSchema({ ...helpers, parameters: effectiveParams }),
    getMailboxSchema({ ...helpers, parameters: effectiveParams }),
    getThreadSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};