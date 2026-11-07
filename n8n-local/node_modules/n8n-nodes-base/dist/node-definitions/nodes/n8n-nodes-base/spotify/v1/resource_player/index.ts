/**
 * Spotify - Player Resource
 * Re-exports all operation types for this resource.
 */

import type { SpotifyV1PlayerAddSongToQueueNode } from './operation_add_song_to_queue';
import type { SpotifyV1PlayerCurrentlyPlayingNode } from './operation_currently_playing';
import type { SpotifyV1PlayerNextSongNode } from './operation_next_song';
import type { SpotifyV1PlayerPauseNode } from './operation_pause';
import type { SpotifyV1PlayerPreviousSongNode } from './operation_previous_song';
import type { SpotifyV1PlayerRecentlyPlayedNode } from './operation_recently_played';
import type { SpotifyV1PlayerResumeNode } from './operation_resume';
import type { SpotifyV1PlayerStartMusicNode } from './operation_start_music';
import type { SpotifyV1PlayerVolumeNode } from './operation_volume';

export * from './operation_add_song_to_queue';
export * from './operation_currently_playing';
export * from './operation_next_song';
export * from './operation_pause';
export * from './operation_previous_song';
export * from './operation_recently_played';
export * from './operation_resume';
export * from './operation_start_music';
export * from './operation_volume';

export type SpotifyV1PlayerNode =
  | SpotifyV1PlayerAddSongToQueueNode
  | SpotifyV1PlayerCurrentlyPlayingNode
  | SpotifyV1PlayerNextSongNode
  | SpotifyV1PlayerPauseNode
  | SpotifyV1PlayerPreviousSongNode
  | SpotifyV1PlayerRecentlyPlayedNode
  | SpotifyV1PlayerResumeNode
  | SpotifyV1PlayerStartMusicNode
  | SpotifyV1PlayerVolumeNode
  ;