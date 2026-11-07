/**
 * YouTube Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { YouTubeV1ChannelNode } from './resource_channel';
import type { YouTubeV1PlaylistNode } from './resource_playlist';
import type { YouTubeV1PlaylistItemNode } from './resource_playlist_item';
import type { YouTubeV1VideoNode } from './resource_video';
import type { YouTubeV1VideoCategoryNode } from './resource_video_category';

export * from './resource_channel';
export * from './resource_playlist';
export * from './resource_playlist_item';
export * from './resource_video';
export * from './resource_video_category';

export type YouTubeV1Node =
  | YouTubeV1ChannelNode
  | YouTubeV1PlaylistNode
  | YouTubeV1PlaylistItemNode
  | YouTubeV1VideoNode
  | YouTubeV1VideoCategoryNode
  ;