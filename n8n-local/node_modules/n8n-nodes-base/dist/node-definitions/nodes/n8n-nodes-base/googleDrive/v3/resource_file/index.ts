/**
 * Google Drive - File Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleDriveV3FileCopyNode } from './operation_copy';
import type { GoogleDriveV3FileCreateFromTextNode } from './operation_create_from_text';
import type { GoogleDriveV3FileDeleteFileNode } from './operation_delete_file';
import type { GoogleDriveV3FileDownloadNode } from './operation_download';
import type { GoogleDriveV3FileMoveNode } from './operation_move';
import type { GoogleDriveV3FileShareNode } from './operation_share';
import type { GoogleDriveV3FileUpdateNode } from './operation_update';
import type { GoogleDriveV3FileUploadNode } from './operation_upload';

export * from './operation_copy';
export * from './operation_create_from_text';
export * from './operation_delete_file';
export * from './operation_download';
export * from './operation_move';
export * from './operation_share';
export * from './operation_update';
export * from './operation_upload';

export type GoogleDriveV3FileNode =
  | GoogleDriveV3FileCopyNode
  | GoogleDriveV3FileCreateFromTextNode
  | GoogleDriveV3FileDeleteFileNode
  | GoogleDriveV3FileDownloadNode
  | GoogleDriveV3FileMoveNode
  | GoogleDriveV3FileShareNode
  | GoogleDriveV3FileUpdateNode
  | GoogleDriveV3FileUploadNode
  ;