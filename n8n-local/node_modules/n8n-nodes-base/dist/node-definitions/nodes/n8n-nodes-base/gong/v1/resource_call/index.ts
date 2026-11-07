/**
 * Gong - Call Resource
 * Re-exports all operation types for this resource.
 */

import type { GongV1CallGetNode } from './operation_get';
import type { GongV1CallGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type GongV1CallNode =
  | GongV1CallGetNode
  | GongV1CallGetAllNode
  ;