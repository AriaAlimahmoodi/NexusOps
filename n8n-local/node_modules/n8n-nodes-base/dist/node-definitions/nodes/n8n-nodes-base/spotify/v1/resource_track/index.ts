/**
 * Spotify - Track Resource
 * Re-exports all operation types for this resource.
 */

import type { SpotifyV1TrackGetNode } from './operation_get';
import type { SpotifyV1TrackGetAudioFeaturesNode } from './operation_get_audio_features';
import type { SpotifyV1TrackSearchNode } from './operation_search';

export * from './operation_get';
export * from './operation_get_audio_features';
export * from './operation_search';

export type SpotifyV1TrackNode =
  | SpotifyV1TrackGetNode
  | SpotifyV1TrackGetAudioFeaturesNode
  | SpotifyV1TrackSearchNode
  ;