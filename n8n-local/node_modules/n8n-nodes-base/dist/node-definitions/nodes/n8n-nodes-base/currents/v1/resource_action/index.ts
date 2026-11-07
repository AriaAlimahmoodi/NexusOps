/**
 * Currents - Action Resource
 * Re-exports all operation types for this resource.
 */

import type { CurrentsV1ActionCreateNode } from './operation_create';
import type { CurrentsV1ActionDeleteNode } from './operation_delete';
import type { CurrentsV1ActionDisableNode } from './operation_disable';
import type { CurrentsV1ActionEnableNode } from './operation_enable';
import type { CurrentsV1ActionGetNode } from './operation_get';
import type { CurrentsV1ActionGetAllNode } from './operation_get_all';
import type { CurrentsV1ActionUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_disable';
export * from './operation_enable';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type CurrentsV1ActionNode =
  | CurrentsV1ActionCreateNode
  | CurrentsV1ActionDeleteNode
  | CurrentsV1ActionDisableNode
  | CurrentsV1ActionEnableNode
  | CurrentsV1ActionGetNode
  | CurrentsV1ActionGetAllNode
  | CurrentsV1ActionUpdateNode
  ;