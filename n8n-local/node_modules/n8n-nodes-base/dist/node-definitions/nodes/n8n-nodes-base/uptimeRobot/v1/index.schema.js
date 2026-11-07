/**
 * UptimeRobot Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAccountSchema = require('./resource_account/index.schema');
const getAlertContactSchema = require('./resource_alert_contact/index.schema');
const getMaintenanceWindowSchema = require('./resource_maintenance_window/index.schema');
const getMonitorSchema = require('./resource_monitor/index.schema');
const getPublicStatusPageSchema = require('./resource_public_status_page/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'account' } : parameters;
  return z.union([
    getAccountSchema({ ...helpers, parameters: effectiveParams }),
    getAlertContactSchema({ ...helpers, parameters: effectiveParams }),
    getMaintenanceWindowSchema({ ...helpers, parameters: effectiveParams }),
    getMonitorSchema({ ...helpers, parameters: effectiveParams }),
    getPublicStatusPageSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};