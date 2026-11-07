/**
 * Slack - Star Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV24StarAddNode } from './operation_add';
import type { SlackV24StarDeleteNode } from './operation_delete';
import type { SlackV24StarGetAllNode } from './operation_get_all';

export * from './operation_add';
export * from './operation_delete';
export * from './operation_get_all';

export type SlackV24StarNode =
  | SlackV24StarAddNode
  | SlackV24StarDeleteNode
  | SlackV24StarGetAllNode
  ;