/**
 * Slack - Star Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV21StarAddNode } from './operation_add';
import type { SlackV21StarDeleteNode } from './operation_delete';
import type { SlackV21StarGetAllNode } from './operation_get_all';

export * from './operation_add';
export * from './operation_delete';
export * from './operation_get_all';

export type SlackV21StarNode =
  | SlackV21StarAddNode
  | SlackV21StarDeleteNode
  | SlackV21StarGetAllNode
  ;