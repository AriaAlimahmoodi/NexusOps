/**
 * Edit Fields (Set) Node - Version 3
 * Re-exports all discriminator combinations.
 */

import type { SetV3ManualNode } from './mode_manual';
import type { SetV3RawNode } from './mode_raw';

export * from './mode_manual';
export * from './mode_raw';

export type SetV3Node =
  | SetV3ManualNode
  | SetV3RawNode
  ;