/**
 * Freshservice Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAgentSchema = require('./resource_agent/index.schema');
const getAgentGroupSchema = require('./resource_agent_group/index.schema');
const getAgentRoleSchema = require('./resource_agent_role/index.schema');
const getAnnouncementSchema = require('./resource_announcement/index.schema');
const getAssetTypeSchema = require('./resource_asset_type/index.schema');
const getChangeSchema = require('./resource_change/index.schema');
const getDepartmentSchema = require('./resource_department/index.schema');
const getLocationSchema = require('./resource_location/index.schema');
const getProblemSchema = require('./resource_problem/index.schema');
const getProductSchema = require('./resource_product/index.schema');
const getReleaseSchema = require('./resource_release/index.schema');
const getRequesterSchema = require('./resource_requester/index.schema');
const getRequesterGroupSchema = require('./resource_requester_group/index.schema');
const getSoftwareSchema = require('./resource_software/index.schema');
const getTicketSchema = require('./resource_ticket/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'agent' } : parameters;
  return z.union([
    getAgentSchema({ ...helpers, parameters: effectiveParams }),
    getAgentGroupSchema({ ...helpers, parameters: effectiveParams }),
    getAgentRoleSchema({ ...helpers, parameters: effectiveParams }),
    getAnnouncementSchema({ ...helpers, parameters: effectiveParams }),
    getAssetTypeSchema({ ...helpers, parameters: effectiveParams }),
    getChangeSchema({ ...helpers, parameters: effectiveParams }),
    getDepartmentSchema({ ...helpers, parameters: effectiveParams }),
    getLocationSchema({ ...helpers, parameters: effectiveParams }),
    getProblemSchema({ ...helpers, parameters: effectiveParams }),
    getProductSchema({ ...helpers, parameters: effectiveParams }),
    getReleaseSchema({ ...helpers, parameters: effectiveParams }),
    getRequesterSchema({ ...helpers, parameters: effectiveParams }),
    getRequesterGroupSchema({ ...helpers, parameters: effectiveParams }),
    getSoftwareSchema({ ...helpers, parameters: effectiveParams }),
    getTicketSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};