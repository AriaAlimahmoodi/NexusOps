/**
 * MiniMax - Video Resource
 * Re-exports all operation types for this resource.
 */

import type { LcMinimaxV1VideoImageToVideoNode } from './operation_image_to_video';
import type { LcMinimaxV1VideoTextToVideoNode } from './operation_text_to_video';

export * from './operation_image_to_video';
export * from './operation_text_to_video';

export type LcMinimaxV1VideoNode =
  | LcMinimaxV1VideoImageToVideoNode
  | LcMinimaxV1VideoTextToVideoNode
  ;