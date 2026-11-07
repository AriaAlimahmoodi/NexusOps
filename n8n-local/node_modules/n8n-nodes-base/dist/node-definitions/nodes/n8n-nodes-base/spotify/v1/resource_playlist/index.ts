/**
 * Spotify - Playlist Resource
 * Re-exports all operation types for this resource.
 */

import type { SpotifyV1PlaylistAddNode } from './operation_add';
import type { SpotifyV1PlaylistCreateNode } from './operation_create';
import type { SpotifyV1PlaylistDeleteNode } from './operation_delete';
import type { SpotifyV1PlaylistGetNode } from './operation_get';
import type { SpotifyV1PlaylistGetTracksNode } from './operation_get_tracks';
import type { SpotifyV1PlaylistGetUserPlaylistsNode } from './operation_get_user_playlists';
import type { SpotifyV1PlaylistSearchNode } from './operation_search';

export * from './operation_add';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_tracks';
export * from './operation_get_user_playlists';
export * from './operation_search';

export type SpotifyV1PlaylistNode =
  | SpotifyV1PlaylistAddNode
  | SpotifyV1PlaylistCreateNode
  | SpotifyV1PlaylistDeleteNode
  | SpotifyV1PlaylistGetNode
  | SpotifyV1PlaylistGetTracksNode
  | SpotifyV1PlaylistGetUserPlaylistsNode
  | SpotifyV1PlaylistSearchNode
  ;