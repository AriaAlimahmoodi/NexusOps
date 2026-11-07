/**
 * Edit Fields (Set) Node - Version 3.1
 * Re-exports all discriminator combinations.
 */

import type { SetV31ManualNode } from './mode_manual';
import type { SetV31RawNode } from './mode_raw';

export * from './mode_manual';
export * from './mode_raw';

export type SetV31Node =
  | SetV31ManualNode
  | SetV31RawNode
  ;