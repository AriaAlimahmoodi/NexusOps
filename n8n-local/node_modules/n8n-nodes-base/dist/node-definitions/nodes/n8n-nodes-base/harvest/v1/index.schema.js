/**
 * Harvest Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getClientSchema = require('./resource_client/index.schema');
const getCompanySchema = require('./resource_company/index.schema');
const getContactSchema = require('./resource_contact/index.schema');
const getEstimateSchema = require('./resource_estimate/index.schema');
const getExpenseSchema = require('./resource_expense/index.schema');
const getInvoiceSchema = require('./resource_invoice/index.schema');
const getProjectSchema = require('./resource_project/index.schema');
const getTaskSchema = require('./resource_task/index.schema');
const getTimeEntrySchema = require('./resource_time_entry/index.schema');
const getUserSchema = require('./resource_user/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'task' } : parameters;
  return z.union([
    getClientSchema({ ...helpers, parameters: effectiveParams }),
    getCompanySchema({ ...helpers, parameters: effectiveParams }),
    getContactSchema({ ...helpers, parameters: effectiveParams }),
    getEstimateSchema({ ...helpers, parameters: effectiveParams }),
    getExpenseSchema({ ...helpers, parameters: effectiveParams }),
    getInvoiceSchema({ ...helpers, parameters: effectiveParams }),
    getProjectSchema({ ...helpers, parameters: effectiveParams }),
    getTaskSchema({ ...helpers, parameters: effectiveParams }),
    getTimeEntrySchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};