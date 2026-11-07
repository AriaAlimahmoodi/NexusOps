/**
 * Slack - File Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV24FileGetNode } from './operation_get';
import type { SlackV24FileGetAllNode } from './operation_get_all';
import type { SlackV24FileUploadNode } from './operation_upload';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_upload';

export type SlackV24FileNode =
  | SlackV24FileGetNode
  | SlackV24FileGetAllNode
  | SlackV24FileUploadNode
  ;