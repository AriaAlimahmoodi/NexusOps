/**
 * S3 - File Resource
 * Re-exports all operation types for this resource.
 */

import type { S3V1FileCopyNode } from './operation_copy';
import type { S3V1FileDeleteNode } from './operation_delete';
import type { S3V1FileDownloadNode } from './operation_download';
import type { S3V1FileGetAllNode } from './operation_get_all';
import type { S3V1FileUploadNode } from './operation_upload';

export * from './operation_copy';
export * from './operation_delete';
export * from './operation_download';
export * from './operation_get_all';
export * from './operation_upload';

export type S3V1FileNode =
  | S3V1FileCopyNode
  | S3V1FileDeleteNode
  | S3V1FileDownloadNode
  | S3V1FileGetAllNode
  | S3V1FileUploadNode
  ;