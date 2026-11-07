/**
 * Slack - File Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV2FileGetNode } from './operation_get';
import type { SlackV2FileGetAllNode } from './operation_get_all';
import type { SlackV2FileUploadNode } from './operation_upload';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_upload';

export type SlackV2FileNode =
  | SlackV2FileGetNode
  | SlackV2FileGetAllNode
  | SlackV2FileUploadNode
  ;