/**
 * Qwen Cloud Node - Version 1.1
 * Re-exports all discriminator combinations.
 */

import type { LcAlibabaCloudV11TextNode } from './resource_text';
import type { LcAlibabaCloudV11ImageNode } from './resource_image';
import type { LcAlibabaCloudV11VideoNode } from './resource_video';

export * from './resource_text';
export * from './resource_image';
export * from './resource_video';

export type LcAlibabaCloudV11Node =
  | LcAlibabaCloudV11TextNode
  | LcAlibabaCloudV11ImageNode
  | LcAlibabaCloudV11VideoNode
  ;