/**
 * Gong Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GongV1CallNode } from './resource_call';
import type { GongV1UserNode } from './resource_user';

export * from './resource_call';
export * from './resource_user';

export type GongV1Node =
  | GongV1CallNode
  | GongV1UserNode
  ;