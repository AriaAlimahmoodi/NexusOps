/**
 * MISP Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAttributeSchema = require('./resource_attribute/index.schema');
const getEventSchema = require('./resource_event/index.schema');
const getEventTagSchema = require('./resource_event_tag/index.schema');
const getFeedSchema = require('./resource_feed/index.schema');
const getGalaxySchema = require('./resource_galaxy/index.schema');
const getNoticelistSchema = require('./resource_noticelist/index.schema');
const getObjectSchema = require('./resource_object/index.schema');
const getOrganisationSchema = require('./resource_organisation/index.schema');
const getTagSchema = require('./resource_tag/index.schema');
const getUserSchema = require('./resource_user/index.schema');
const getWarninglistSchema = require('./resource_warninglist/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'attribute' } : parameters;
  return z.union([
    getAttributeSchema({ ...helpers, parameters: effectiveParams }),
    getEventSchema({ ...helpers, parameters: effectiveParams }),
    getEventTagSchema({ ...helpers, parameters: effectiveParams }),
    getFeedSchema({ ...helpers, parameters: effectiveParams }),
    getGalaxySchema({ ...helpers, parameters: effectiveParams }),
    getNoticelistSchema({ ...helpers, parameters: effectiveParams }),
    getObjectSchema({ ...helpers, parameters: effectiveParams }),
    getOrganisationSchema({ ...helpers, parameters: effectiveParams }),
    getTagSchema({ ...helpers, parameters: effectiveParams }),
    getUserSchema({ ...helpers, parameters: effectiveParams }),
    getWarninglistSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};