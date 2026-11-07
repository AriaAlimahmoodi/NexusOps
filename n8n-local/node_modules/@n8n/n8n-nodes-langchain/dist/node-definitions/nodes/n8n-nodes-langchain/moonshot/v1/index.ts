/**
 * Moonshot Kimi Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { LcMoonshotV1ImageNode } from './resource_image';
import type { LcMoonshotV1TextNode } from './resource_text';

export * from './resource_image';
export * from './resource_text';

export type LcMoonshotV1Node =
  | LcMoonshotV1ImageNode
  | LcMoonshotV1TextNode
  ;