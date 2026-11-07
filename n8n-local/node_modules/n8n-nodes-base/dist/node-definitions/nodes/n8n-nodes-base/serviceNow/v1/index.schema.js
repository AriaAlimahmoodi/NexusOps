/**
 * ServiceNow Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAttachmentSchema = require('./resource_attachment/index.schema');
const getBusinessServiceSchema = require('./resource_business_service/index.schema');
const getConfigurationItemsSchema = require('./resource_configuration_items/index.schema');
const getDepartmentSchema = require('./resource_department/index.schema');
const getDictionarySchema = require('./resource_dictionary/index.schema');
const getIncidentSchema = require('./resource_incident/index.schema');
const getTableRecordSchema = require('./resource_table_record/index.schema');
const getUserSchema = require('./resource_user/index.schema');
const getUserGroupSchema = require('./resource_user_group/index.schema');
const getUserRoleSchema = require('./resource_user_role/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'user' } : parameters;
  return z.union([
    getAttachmentSchema({ ...helpers, parameters: effectiveParams }),
    getBusinessServiceSchema({ ...helpers, parameters: effectiveParams }),
    getConfigurationItemsSchema({ ...helpers, parameters: effectiveParams }),
    getDepartmentSchema({ ...helpers, parameters: effectiveParams }),
    getDictionarySchema({ ...helpers, parameters: effectiveParams }),
    getIncidentSchema({ ...helpers, parameters: effectiveParams }),
    getTableRecordSchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
    getUserGroupSchema({ ...helpers, parameters: effectiveParams }),
    getUserRoleSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};