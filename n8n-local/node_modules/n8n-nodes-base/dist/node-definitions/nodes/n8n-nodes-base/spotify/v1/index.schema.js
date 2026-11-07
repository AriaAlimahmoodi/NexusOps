/**
 * Spotify Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAlbumSchema = require('./resource_album/index.schema');
const getArtistSchema = require('./resource_artist/index.schema');
const getLibrarySchema = require('./resource_library/index.schema');
const getMyDataSchema = require('./resource_my_data/index.schema');
const getPlayerSchema = require('./resource_player/index.schema');
const getPlaylistSchema = require('./resource_playlist/index.schema');
const getTrackSchema = require('./resource_track/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'player' } : parameters;
  return z.union([
    getAlbumSchema({ ...helpers, parameters: effectiveParams }),
    getArtistSchema({ ...helpers, parameters: effectiveParams }),
    getLibrarySchema({ ...helpers, parameters: effectiveParams }),
    getMyDataSchema({ ...helpers, parameters: effectiveParams }),
    getPlayerSchema({ ...helpers, parameters: effectiveParams }),
    getPlaylistSchema({ ...helpers, parameters: effectiveParams }),
    getTrackSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};