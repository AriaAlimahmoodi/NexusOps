/**
 * MISP - EventTag Resource
 * Re-exports all operation types for this resource.
 */

import type { MispV1EventTagAddNode } from './operation_add';
import type { MispV1EventTagRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_remove';

export type MispV1EventTagNode =
  | MispV1EventTagAddNode
  | MispV1EventTagRemoveNode
  ;