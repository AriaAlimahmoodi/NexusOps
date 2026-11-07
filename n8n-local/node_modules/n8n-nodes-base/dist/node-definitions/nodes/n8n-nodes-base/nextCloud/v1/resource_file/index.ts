/**
 * Nextcloud - File Resource
 * Re-exports all operation types for this resource.
 */

import type { NextCloudV1FileCopyNode } from './operation_copy';
import type { NextCloudV1FileDeleteNode } from './operation_delete';
import type { NextCloudV1FileDownloadNode } from './operation_download';
import type { NextCloudV1FileMoveNode } from './operation_move';
import type { NextCloudV1FileShareNode } from './operation_share';
import type { NextCloudV1FileUploadNode } from './operation_upload';

export * from './operation_copy';
export * from './operation_delete';
export * from './operation_download';
export * from './operation_move';
export * from './operation_share';
export * from './operation_upload';

export type NextCloudV1FileNode =
  | NextCloudV1FileCopyNode
  | NextCloudV1FileDeleteNode
  | NextCloudV1FileDownloadNode
  | NextCloudV1FileMoveNode
  | NextCloudV1FileShareNode
  | NextCloudV1FileUploadNode
  ;