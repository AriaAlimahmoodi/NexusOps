/**
 * Slack - File Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV21FileGetNode } from './operation_get';
import type { SlackV21FileGetAllNode } from './operation_get_all';
import type { SlackV21FileUploadNode } from './operation_upload';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_upload';

export type SlackV21FileNode =
  | SlackV21FileGetNode
  | SlackV21FileGetAllNode
  | SlackV21FileUploadNode
  ;