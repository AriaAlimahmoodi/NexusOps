/**
 * Spotify Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { SpotifyV1AlbumNode } from './resource_album';
import type { SpotifyV1ArtistNode } from './resource_artist';
import type { SpotifyV1LibraryNode } from './resource_library';
import type { SpotifyV1MyDataNode } from './resource_my_data';
import type { SpotifyV1PlayerNode } from './resource_player';
import type { SpotifyV1PlaylistNode } from './resource_playlist';
import type { SpotifyV1TrackNode } from './resource_track';

export * from './resource_album';
export * from './resource_artist';
export * from './resource_library';
export * from './resource_my_data';
export * from './resource_player';
export * from './resource_playlist';
export * from './resource_track';

export type SpotifyV1Node =
  | SpotifyV1AlbumNode
  | SpotifyV1ArtistNode
  | SpotifyV1LibraryNode
  | SpotifyV1MyDataNode
  | SpotifyV1PlayerNode
  | SpotifyV1PlaylistNode
  | SpotifyV1TrackNode
  ;