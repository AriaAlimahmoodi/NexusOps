/**
 * Qwen Cloud - Video Resource
 * Re-exports all operation types for this resource.
 */

import type { LcAlibabaCloudV11VideoImageToVideoNode } from './operation_image_to_video';
import type { LcAlibabaCloudV11VideoTextToVideoNode } from './operation_text_to_video';

export * from './operation_image_to_video';
export * from './operation_text_to_video';

export type LcAlibabaCloudV11VideoNode =
  | LcAlibabaCloudV11VideoImageToVideoNode
  | LcAlibabaCloudV11VideoTextToVideoNode
  ;