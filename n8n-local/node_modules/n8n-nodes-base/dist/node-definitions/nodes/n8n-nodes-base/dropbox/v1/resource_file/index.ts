/**
 * Dropbox - File Resource
 * Re-exports all operation types for this resource.
 */

import type { DropboxV1FileCopyNode } from './operation_copy';
import type { DropboxV1FileDeleteNode } from './operation_delete';
import type { DropboxV1FileDownloadNode } from './operation_download';
import type { DropboxV1FileMoveNode } from './operation_move';
import type { DropboxV1FileUploadNode } from './operation_upload';

export * from './operation_copy';
export * from './operation_delete';
export * from './operation_download';
export * from './operation_move';
export * from './operation_upload';

export type DropboxV1FileNode =
  | DropboxV1FileCopyNode
  | DropboxV1FileDeleteNode
  | DropboxV1FileDownloadNode
  | DropboxV1FileMoveNode
  | DropboxV1FileUploadNode
  ;