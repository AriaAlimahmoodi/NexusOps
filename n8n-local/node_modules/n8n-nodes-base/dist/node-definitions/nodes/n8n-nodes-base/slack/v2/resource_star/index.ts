/**
 * Slack - Star Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV2StarAddNode } from './operation_add';
import type { SlackV2StarDeleteNode } from './operation_delete';
import type { SlackV2StarGetAllNode } from './operation_get_all';

export * from './operation_add';
export * from './operation_delete';
export * from './operation_get_all';

export type SlackV2StarNode =
  | SlackV2StarAddNode
  | SlackV2StarDeleteNode
  | SlackV2StarGetAllNode
  ;