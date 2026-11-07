/**
 * YouTube Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getChannelSchema = require('./resource_channel/index.schema');
const getPlaylistSchema = require('./resource_playlist/index.schema');
const getPlaylistItemSchema = require('./resource_playlist_item/index.schema');
const getVideoSchema = require('./resource_video/index.schema');
const getVideoCategorySchema = require('./resource_video_category/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'channel' } : parameters;
  return z.union([
    getChannelSchema({ ...helpers, parameters: effectiveParams }),
    getPlaylistSchema({ ...helpers, parameters: effectiveParams }),
    getPlaylistItemSchema({ ...helpers, parameters: effectiveParams }),
    getVideoSchema({ ...helpers, parameters: effectiveParams }),
    getVideoCategorySchema({ ...helpers, parameters: effectiveParams }),
  ]);
};