/**
 * Spotify - Album Resource
 * Re-exports all operation types for this resource.
 */

import type { SpotifyV1AlbumGetNode } from './operation_get';
import type { SpotifyV1AlbumGetNewReleasesNode } from './operation_get_new_releases';
import type { SpotifyV1AlbumGetTracksNode } from './operation_get_tracks';
import type { SpotifyV1AlbumSearchNode } from './operation_search';

export * from './operation_get';
export * from './operation_get_new_releases';
export * from './operation_get_tracks';
export * from './operation_search';

export type SpotifyV1AlbumNode =
  | SpotifyV1AlbumGetNode
  | SpotifyV1AlbumGetNewReleasesNode
  | SpotifyV1AlbumGetTracksNode
  | SpotifyV1AlbumSearchNode
  ;