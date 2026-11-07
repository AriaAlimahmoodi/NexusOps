/**
 * Gong - User Resource
 * Re-exports all operation types for this resource.
 */

import type { GongV1UserGetNode } from './operation_get';
import type { GongV1UserGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type GongV1UserNode =
  | GongV1UserGetNode
  | GongV1UserGetAllNode
  ;