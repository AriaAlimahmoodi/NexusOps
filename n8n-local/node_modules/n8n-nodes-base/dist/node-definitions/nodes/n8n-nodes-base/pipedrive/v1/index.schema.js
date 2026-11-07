/**
 * Pipedrive Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getActivitySchema = require('./resource_activity/index.schema');
const getDealSchema = require('./resource_deal/index.schema');
const getDealActivitySchema = require('./resource_deal_activity/index.schema');
const getDealProductSchema = require('./resource_deal_product/index.schema');
const getFileSchema = require('./resource_file/index.schema');
const getLeadSchema = require('./resource_lead/index.schema');
const getNoteSchema = require('./resource_note/index.schema');
const getOrganizationSchema = require('./resource_organization/index.schema');
const getPersonSchema = require('./resource_person/index.schema');
const getProductSchema = require('./resource_product/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'deal' } : parameters;
  return z.union([
    getActivitySchema({ ...helpers, parameters: effectiveParams }),
    getDealSchema({ ...helpers, parameters: effectiveParams }),
    getDealActivitySchema({ ...helpers, parameters: effectiveParams }),
    getDealProductSchema({ ...helpers, parameters: effectiveParams }),
    getFileSchema({ ...helpers, parameters: effectiveParams }),
    getLeadSchema({ ...helpers, parameters: effectiveParams }),
    getNoteSchema({ ...helpers, parameters: effectiveParams }),
    getOrganizationSchema({ ...helpers, parameters: effectiveParams }),
    getPersonSchema({ ...helpers, parameters: effectiveParams }),
    getProductSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};