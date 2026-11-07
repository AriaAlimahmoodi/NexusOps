/**
 * Google Drive - File Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleDriveV2FileCopyNode } from './operation_copy';
import type { GoogleDriveV2FileDeleteNode } from './operation_delete';
import type { GoogleDriveV2FileDownloadNode } from './operation_download';
import type { GoogleDriveV2FileListNode } from './operation_list';
import type { GoogleDriveV2FileShareNode } from './operation_share';
import type { GoogleDriveV2FileUpdateNode } from './operation_update';
import type { GoogleDriveV2FileUploadNode } from './operation_upload';

export * from './operation_copy';
export * from './operation_delete';
export * from './operation_download';
export * from './operation_list';
export * from './operation_share';
export * from './operation_update';
export * from './operation_upload';

export type GoogleDriveV2FileNode =
  | GoogleDriveV2FileCopyNode
  | GoogleDriveV2FileDeleteNode
  | GoogleDriveV2FileDownloadNode
  | GoogleDriveV2FileListNode
  | GoogleDriveV2FileShareNode
  | GoogleDriveV2FileUpdateNode
  | GoogleDriveV2FileUploadNode
  ;