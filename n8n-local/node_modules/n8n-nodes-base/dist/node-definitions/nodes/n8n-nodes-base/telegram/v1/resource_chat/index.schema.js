/**
 * Telegram - Chat Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAdministratorsSchema = require('./operation_administrators.schema');
const getGetSchema = require('./operation_get.schema');
const getLeaveSchema = require('./operation_leave.schema');
const getMemberSchema = require('./operation_member.schema');
const getSetDescriptionSchema = require('./operation_set_description.schema');
const getSetTitleSchema = require('./operation_set_title.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'get' } : parameters;
  return z.union([
    getAdministratorsSchema({ ...helpers, parameters: effectiveParams }),
    getGetSchema({ ...helpers, parameters: effectiveParams }),
    getLeaveSchema({ ...helpers, parameters: effectiveParams }),
    getMemberSchema({ ...helpers, parameters: effectiveParams }),
    getSetDescriptionSchema({ ...helpers, parameters: effectiveParams }),
    getSetTitleSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};