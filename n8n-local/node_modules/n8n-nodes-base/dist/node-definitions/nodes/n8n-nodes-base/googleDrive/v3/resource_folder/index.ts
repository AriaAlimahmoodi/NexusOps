/**
 * Google Drive - Folder Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleDriveV3FolderCreateNode } from './operation_create';
import type { GoogleDriveV3FolderDeleteFolderNode } from './operation_delete_folder';
import type { GoogleDriveV3FolderShareNode } from './operation_share';

export * from './operation_create';
export * from './operation_delete_folder';
export * from './operation_share';

export type GoogleDriveV3FolderNode =
  | GoogleDriveV3FolderCreateNode
  | GoogleDriveV3FolderDeleteFolderNode
  | GoogleDriveV3FolderShareNode
  ;