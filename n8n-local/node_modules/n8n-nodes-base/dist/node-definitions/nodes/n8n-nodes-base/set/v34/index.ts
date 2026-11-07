/**
 * Edit Fields (Set) Node - Version 3.4
 * Re-exports all discriminator combinations.
 */

import type { SetV34ManualNode } from './mode_manual';
import type { SetV34RawNode } from './mode_raw';

export * from './mode_manual';
export * from './mode_raw';

export type SetV34Node =
  | SetV34ManualNode
  | SetV34RawNode
  ;