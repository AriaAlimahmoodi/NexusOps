/**
 * Slack - File Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV1FileGetNode } from './operation_get';
import type { SlackV1FileGetAllNode } from './operation_get_all';
import type { SlackV1FileUploadNode } from './operation_upload';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_upload';

export type SlackV1FileNode =
  | SlackV1FileGetNode
  | SlackV1FileGetAllNode
  | SlackV1FileUploadNode
  ;