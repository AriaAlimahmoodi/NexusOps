/**
 * Edit Fields (Set) Node - Version 3.2
 * Re-exports all discriminator combinations.
 */

import type { SetV32ManualNode } from './mode_manual';
import type { SetV32RawNode } from './mode_raw';

export * from './mode_manual';
export * from './mode_raw';

export type SetV32Node =
  | SetV32ManualNode
  | SetV32RawNode
  ;