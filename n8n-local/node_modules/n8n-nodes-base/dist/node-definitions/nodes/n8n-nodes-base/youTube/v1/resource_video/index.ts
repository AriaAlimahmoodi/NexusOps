/**
 * YouTube - Video Resource
 * Re-exports all operation types for this resource.
 */

import type { YouTubeV1VideoDeleteNode } from './operation_delete';
import type { YouTubeV1VideoGetNode } from './operation_get';
import type { YouTubeV1VideoGetAllNode } from './operation_get_all';
import type { YouTubeV1VideoRateNode } from './operation_rate';
import type { YouTubeV1VideoUpdateNode } from './operation_update';
import type { YouTubeV1VideoUploadNode } from './operation_upload';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_rate';
export * from './operation_update';
export * from './operation_upload';

export type YouTubeV1VideoNode =
  | YouTubeV1VideoDeleteNode
  | YouTubeV1VideoGetNode
  | YouTubeV1VideoGetAllNode
  | YouTubeV1VideoRateNode
  | YouTubeV1VideoUpdateNode
  | YouTubeV1VideoUploadNode
  ;