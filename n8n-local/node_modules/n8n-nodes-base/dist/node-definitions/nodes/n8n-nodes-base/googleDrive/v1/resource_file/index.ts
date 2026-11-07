/**
 * Google Drive - File Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleDriveV1FileCopyNode } from './operation_copy';
import type { GoogleDriveV1FileDeleteNode } from './operation_delete';
import type { GoogleDriveV1FileDownloadNode } from './operation_download';
import type { GoogleDriveV1FileListNode } from './operation_list';
import type { GoogleDriveV1FileShareNode } from './operation_share';
import type { GoogleDriveV1FileUpdateNode } from './operation_update';
import type { GoogleDriveV1FileUploadNode } from './operation_upload';

export * from './operation_copy';
export * from './operation_delete';
export * from './operation_download';
export * from './operation_list';
export * from './operation_share';
export * from './operation_update';
export * from './operation_upload';

export type GoogleDriveV1FileNode =
  | GoogleDriveV1FileCopyNode
  | GoogleDriveV1FileDeleteNode
  | GoogleDriveV1FileDownloadNode
  | GoogleDriveV1FileListNode
  | GoogleDriveV1FileShareNode
  | GoogleDriveV1FileUpdateNode
  | GoogleDriveV1FileUploadNode
  ;