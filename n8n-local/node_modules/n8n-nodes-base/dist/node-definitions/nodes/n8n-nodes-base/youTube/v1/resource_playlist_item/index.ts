/**
 * YouTube - PlaylistItem Resource
 * Re-exports all operation types for this resource.
 */

import type { YouTubeV1PlaylistItemAddNode } from './operation_add';
import type { YouTubeV1PlaylistItemDeleteNode } from './operation_delete';
import type { YouTubeV1PlaylistItemGetNode } from './operation_get';
import type { YouTubeV1PlaylistItemGetAllNode } from './operation_get_all';

export * from './operation_add';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type YouTubeV1PlaylistItemNode =
  | YouTubeV1PlaylistItemAddNode
  | YouTubeV1PlaylistItemDeleteNode
  | YouTubeV1PlaylistItemGetNode
  | YouTubeV1PlaylistItemGetAllNode
  ;