/**
 * Spotify - Player Resource - Zod Schema Factory
 * Exports a factory that unions all operation schemas for this resource.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getAddSongToQueueSchema = require('./operation_add_song_to_queue.schema');
const getCurrentlyPlayingSchema = require('./operation_currently_playing.schema');
const getNextSongSchema = require('./operation_next_song.schema');
const getPauseSchema = require('./operation_pause.schema');
const getPreviousSongSchema = require('./operation_previous_song.schema');
const getRecentlyPlayedSchema = require('./operation_recently_played.schema');
const getResumeSchema = require('./operation_resume.schema');
const getStartMusicSchema = require('./operation_start_music.schema');
const getVolumeSchema = require('./operation_volume.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply operation default if not set
  const effectiveParams = parameters.operation === undefined ? { ...parameters, operation: 'addSongToQueue' } : parameters;
  return z.union([
    getAddSongToQueueSchema({ ...helpers, parameters: effectiveParams }),
    getCurrentlyPlayingSchema({ ...helpers, parameters: effectiveParams }),
    getNextSongSchema({ ...helpers, parameters: effectiveParams }),
    getPauseSchema({ ...helpers, parameters: effectiveParams }),
    getPreviousSongSchema({ ...helpers, parameters: effectiveParams }),
    getRecentlyPlayedSchema({ ...helpers, parameters: effectiveParams }),
    getResumeSchema({ ...helpers, parameters: effectiveParams }),
    getStartMusicSchema({ ...helpers, parameters: effectiveParams }),
    getVolumeSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};