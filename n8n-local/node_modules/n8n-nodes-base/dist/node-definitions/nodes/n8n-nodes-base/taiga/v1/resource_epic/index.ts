/**
 * Taiga - Epic Resource
 * Re-exports all operation types for this resource.
 */

import type { TaigaV1EpicCreateNode } from './operation_create';
import type { TaigaV1EpicDeleteNode } from './operation_delete';
import type { TaigaV1EpicGetNode } from './operation_get';
import type { TaigaV1EpicGetAllNode } from './operation_get_all';
import type { TaigaV1EpicUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type TaigaV1EpicNode =
  | TaigaV1EpicCreateNode
  | TaigaV1EpicDeleteNode
  | TaigaV1EpicGetNode
  | TaigaV1EpicGetAllNode
  | TaigaV1EpicUpdateNode
  ;