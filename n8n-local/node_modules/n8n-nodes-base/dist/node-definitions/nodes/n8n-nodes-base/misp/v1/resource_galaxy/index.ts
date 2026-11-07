/**
 * MISP - Galaxy Resource
 * Re-exports all operation types for this resource.
 */

import type { MispV1GalaxyDeleteNode } from './operation_delete';
import type { MispV1GalaxyGetNode } from './operation_get';
import type { MispV1GalaxyGetAllNode } from './operation_get_all';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type MispV1GalaxyNode =
  | MispV1GalaxyDeleteNode
  | MispV1GalaxyGetNode
  | MispV1GalaxyGetAllNode
  ;