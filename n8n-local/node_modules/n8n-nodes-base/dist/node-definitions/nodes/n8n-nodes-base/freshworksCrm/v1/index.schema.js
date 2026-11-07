/**
 * Freshworks CRM Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAccountSchema = require('./resource_account/index.schema');
const getAppointmentSchema = require('./resource_appointment/index.schema');
const getContactSchema = require('./resource_contact/index.schema');
const getDealSchema = require('./resource_deal/index.schema');
const getNoteSchema = require('./resource_note/index.schema');
const getSalesActivitySchema = require('./resource_sales_activity/index.schema');
const getSearchSchema = require('./resource_search/index.schema');
const getTaskSchema = require('./resource_task/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'account' } : parameters;
  return z.union([
    getAccountSchema({ ...helpers, parameters: effectiveParams }),
    getAppointmentSchema({ ...helpers, parameters: effectiveParams }),
    getContactSchema({ ...helpers, parameters: effectiveParams }),
    getDealSchema({ ...helpers, parameters: effectiveParams }),
    getNoteSchema({ ...helpers, parameters: effectiveParams }),
    getSalesActivitySchema({ ...helpers, parameters: effectiveParams }),
    getSearchSchema({ ...helpers, parameters: effectiveParams }),
    getTaskSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};