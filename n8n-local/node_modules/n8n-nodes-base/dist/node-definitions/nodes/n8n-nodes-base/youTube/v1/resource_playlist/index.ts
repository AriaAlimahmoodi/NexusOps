/**
 * YouTube - Playlist Resource
 * Re-exports all operation types for this resource.
 */

import type { YouTubeV1PlaylistCreateNode } from './operation_create';
import type { YouTubeV1PlaylistDeleteNode } from './operation_delete';
import type { YouTubeV1PlaylistGetNode } from './operation_get';
import type { YouTubeV1PlaylistGetAllNode } from './operation_get_all';
import type { YouTubeV1PlaylistUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type YouTubeV1PlaylistNode =
  | YouTubeV1PlaylistCreateNode
  | YouTubeV1PlaylistDeleteNode
  | YouTubeV1PlaylistGetNode
  | YouTubeV1PlaylistGetAllNode
  | YouTubeV1PlaylistUpdateNode
  ;