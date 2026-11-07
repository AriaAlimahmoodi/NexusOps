/**
 * Slack - Star Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV22StarAddNode } from './operation_add';
import type { SlackV22StarDeleteNode } from './operation_delete';
import type { SlackV22StarGetAllNode } from './operation_get_all';

export * from './operation_add';
export * from './operation_delete';
export * from './operation_get_all';

export type SlackV22StarNode =
  | SlackV22StarAddNode
  | SlackV22StarDeleteNode
  | SlackV22StarGetAllNode
  ;