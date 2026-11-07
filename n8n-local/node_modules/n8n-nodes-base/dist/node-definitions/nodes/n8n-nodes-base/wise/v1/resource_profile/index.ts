/**
 * Wise - Profile Resource
 * Re-exports all operation types for this resource.
 */

import type { WiseV1ProfileGetNode } from './operation_get';
import type { WiseV1ProfileGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type WiseV1ProfileNode =
  | WiseV1ProfileGetNode
  | WiseV1ProfileGetAllNode
  ;