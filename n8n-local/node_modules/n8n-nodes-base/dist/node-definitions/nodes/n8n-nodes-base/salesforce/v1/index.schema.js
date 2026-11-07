/**
 * Salesforce Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAccountSchema = require('./resource_account/index.schema');
const getAttachmentSchema = require('./resource_attachment/index.schema');
const getCaseSchema = require('./resource_case/index.schema');
const getContactSchema = require('./resource_contact/index.schema');
const getCustomObjectSchema = require('./resource_custom_object/index.schema');
const getDocumentSchema = require('./resource_document/index.schema');
const getFlowSchema = require('./resource_flow/index.schema');
const getLeadSchema = require('./resource_lead/index.schema');
const getOpportunitySchema = require('./resource_opportunity/index.schema');
const getSearchSchema = require('./resource_search/index.schema');
const getTaskSchema = require('./resource_task/index.schema');
const getUserSchema = require('./resource_user/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'lead' } : parameters;
  return z.union([
    getAccountSchema({ ...helpers, parameters: effectiveParams }),
    getAttachmentSchema({ ...helpers, parameters: effectiveParams }),
    getCaseSchema({ ...helpers, parameters: effectiveParams }),
    getContactSchema({ ...helpers, parameters: effectiveParams }),
    getCustomObjectSchema({ ...helpers, parameters: effectiveParams }),
    getDocumentSchema({ ...helpers, parameters: effectiveParams }),
    getFlowSchema({ ...helpers, parameters: effectiveParams }),
    getLeadSchema({ ...helpers, parameters: effectiveParams }),
    getOpportunitySchema({ ...helpers, parameters: effectiveParams }),
    getSearchSchema({ ...helpers, parameters: effectiveParams }),
    getTaskSchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};