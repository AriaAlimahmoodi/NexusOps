/**
 * Onfleet Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAdminSchema = require('./resource_admin/index.schema');
const getContainerSchema = require('./resource_container/index.schema');
const getDestinationSchema = require('./resource_destination/index.schema');
const getHubSchema = require('./resource_hub/index.schema');
const getOrganizationSchema = require('./resource_organization/index.schema');
const getRecipientSchema = require('./resource_recipient/index.schema');
const getTaskSchema = require('./resource_task/index.schema');
const getTeamSchema = require('./resource_team/index.schema');
const getWorkerSchema = require('./resource_worker/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'task' } : parameters;
  return z.union([
    getAdminSchema({ ...helpers, parameters: effectiveParams }),
    getContainerSchema({ ...helpers, parameters: effectiveParams }),
    getDestinationSchema({ ...helpers, parameters: effectiveParams }),
    getHubSchema({ ...helpers, parameters: effectiveParams }),
    getOrganizationSchema({ ...helpers, parameters: effectiveParams }),
    getRecipientSchema({ ...helpers, parameters: effectiveParams }),
    getTaskSchema({ ...helpers, parameters: effectiveParams }),
    getTeamSchema({ ...helpers, parameters: effectiveParams }),
    getWorkerSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};