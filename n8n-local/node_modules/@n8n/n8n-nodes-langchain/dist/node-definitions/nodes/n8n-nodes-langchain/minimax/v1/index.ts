/**
 * MiniMax Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { LcMinimaxV1AudioNode } from './resource_audio';
import type { LcMinimaxV1ImageNode } from './resource_image';
import type { LcMinimaxV1TextNode } from './resource_text';
import type { LcMinimaxV1VideoNode } from './resource_video';

export * from './resource_audio';
export * from './resource_image';
export * from './resource_text';
export * from './resource_video';

export type LcMinimaxV1Node =
  | LcMinimaxV1AudioNode
  | LcMinimaxV1ImageNode
  | LcMinimaxV1TextNode
  | LcMinimaxV1VideoNode
  ;