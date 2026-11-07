/**
 * Slack - File Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV22FileGetNode } from './operation_get';
import type { SlackV22FileGetAllNode } from './operation_get_all';
import type { SlackV22FileUploadNode } from './operation_upload';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_upload';

export type SlackV22FileNode =
  | SlackV22FileGetNode
  | SlackV22FileGetAllNode
  | SlackV22FileUploadNode
  ;