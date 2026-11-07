/**
 * Home Assistant Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCameraProxySchema = require('./resource_camera_proxy/index.schema');
const getConfigSchema = require('./resource_config/index.schema');
const getEventSchema = require('./resource_event/index.schema');
const getLogSchema = require('./resource_log/index.schema');
const getServiceSchema = require('./resource_service/index.schema');
const getStateSchema = require('./resource_state/index.schema');
const getTemplateSchema = require('./resource_template/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'config' } : parameters;
  return z.union([
    getCameraProxySchema({ ...helpers, parameters: effectiveParams }),
    getConfigSchema({ ...helpers, parameters: effectiveParams }),
    getEventSchema({ ...helpers, parameters: effectiveParams }),
    getLogSchema({ ...helpers, parameters: effectiveParams }),
    getServiceSchema({ ...helpers, parameters: effectiveParams }),
    getStateSchema({ ...helpers, parameters: effectiveParams }),
    getTemplateSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};