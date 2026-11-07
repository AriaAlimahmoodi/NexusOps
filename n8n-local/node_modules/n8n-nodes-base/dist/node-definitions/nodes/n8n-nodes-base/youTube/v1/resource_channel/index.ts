/**
 * YouTube - Channel Resource
 * Re-exports all operation types for this resource.
 */

import type { YouTubeV1ChannelGetNode } from './operation_get';
import type { YouTubeV1ChannelGetAllNode } from './operation_get_all';
import type { YouTubeV1ChannelUpdateNode } from './operation_update';
import type { YouTubeV1ChannelUploadBannerNode } from './operation_upload_banner';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';
export * from './operation_upload_banner';

export type YouTubeV1ChannelNode =
  | YouTubeV1ChannelGetNode
  | YouTubeV1ChannelGetAllNode
  | YouTubeV1ChannelUpdateNode
  | YouTubeV1ChannelUploadBannerNode
  ;