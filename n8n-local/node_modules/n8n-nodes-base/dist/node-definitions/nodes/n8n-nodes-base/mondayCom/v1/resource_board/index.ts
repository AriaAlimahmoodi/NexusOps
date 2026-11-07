/**
 * Monday.com - Board Resource
 * Re-exports all operation types for this resource.
 */

import type { MondayComV1BoardArchiveNode } from './operation_archive';
import type { MondayComV1BoardCreateNode } from './operation_create';
import type { MondayComV1BoardGetNode } from './operation_get';
import type { MondayComV1BoardGetAllNode } from './operation_get_all';

export * from './operation_archive';
export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';

export type MondayComV1BoardNode =
  | MondayComV1BoardArchiveNode
  | MondayComV1BoardCreateNode
  | MondayComV1BoardGetNode
  | MondayComV1BoardGetAllNode
  ;