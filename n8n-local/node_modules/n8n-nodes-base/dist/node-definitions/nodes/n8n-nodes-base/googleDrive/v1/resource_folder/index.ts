/**
 * Google Drive - Folder Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleDriveV1FolderCreateNode } from './operation_create';
import type { GoogleDriveV1FolderDeleteNode } from './operation_delete';
import type { GoogleDriveV1FolderShareNode } from './operation_share';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_share';

export type GoogleDriveV1FolderNode =
  | GoogleDriveV1FolderCreateNode
  | GoogleDriveV1FolderDeleteNode
  | GoogleDriveV1FolderShareNode
  ;