/**
 * Spotify - Artist Resource
 * Re-exports all operation types for this resource.
 */

import type { SpotifyV1ArtistGetNode } from './operation_get';
import type { SpotifyV1ArtistGetAlbumsNode } from './operation_get_albums';
import type { SpotifyV1ArtistGetRelatedArtistsNode } from './operation_get_related_artists';
import type { SpotifyV1ArtistGetTopTracksNode } from './operation_get_top_tracks';
import type { SpotifyV1ArtistSearchNode } from './operation_search';

export * from './operation_get';
export * from './operation_get_albums';
export * from './operation_get_related_artists';
export * from './operation_get_top_tracks';
export * from './operation_search';

export type SpotifyV1ArtistNode =
  | SpotifyV1ArtistGetNode
  | SpotifyV1ArtistGetAlbumsNode
  | SpotifyV1ArtistGetRelatedArtistsNode
  | SpotifyV1ArtistGetTopTracksNode
  | SpotifyV1ArtistSearchNode
  ;