/**
 * Vero Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { VeroV1UserNode } from './resource_user';
import type { VeroV1EventNode } from './resource_event';

export * from './resource_user';
export * from './resource_event';

export type VeroV1Node =
  | VeroV1UserNode
  | VeroV1EventNode
  ;