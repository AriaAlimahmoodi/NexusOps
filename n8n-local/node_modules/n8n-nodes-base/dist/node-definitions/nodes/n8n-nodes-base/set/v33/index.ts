/**
 * Edit Fields (Set) Node - Version 3.3
 * Re-exports all discriminator combinations.
 */

import type { SetV33ManualNode } from './mode_manual';
import type { SetV33RawNode } from './mode_raw';

export * from './mode_manual';
export * from './mode_raw';

export type SetV33Node =
  | SetV33ManualNode
  | SetV33RawNode
  ;