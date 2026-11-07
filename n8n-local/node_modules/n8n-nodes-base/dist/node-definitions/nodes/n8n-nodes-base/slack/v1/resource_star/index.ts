/**
 * Slack - Star Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV1StarAddNode } from './operation_add';
import type { SlackV1StarDeleteNode } from './operation_delete';
import type { SlackV1StarGetAllNode } from './operation_get_all';

export * from './operation_add';
export * from './operation_delete';
export * from './operation_get_all';

export type SlackV1StarNode =
  | SlackV1StarAddNode
  | SlackV1StarDeleteNode
  | SlackV1StarGetAllNode
  ;