/**
 * Slack - Star Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV23StarAddNode } from './operation_add';
import type { SlackV23StarDeleteNode } from './operation_delete';
import type { SlackV23StarGetAllNode } from './operation_get_all';

export * from './operation_add';
export * from './operation_delete';
export * from './operation_get_all';

export type SlackV23StarNode =
  | SlackV23StarAddNode
  | SlackV23StarDeleteNode
  | SlackV23StarGetAllNode
  ;