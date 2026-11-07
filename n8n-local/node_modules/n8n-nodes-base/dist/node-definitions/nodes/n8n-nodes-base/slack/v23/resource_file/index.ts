/**
 * Slack - File Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV23FileGetNode } from './operation_get';
import type { SlackV23FileGetAllNode } from './operation_get_all';
import type { SlackV23FileUploadNode } from './operation_upload';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_upload';

export type SlackV23FileNode =
  | SlackV23FileGetNode
  | SlackV23FileGetAllNode
  | SlackV23FileUploadNode
  ;