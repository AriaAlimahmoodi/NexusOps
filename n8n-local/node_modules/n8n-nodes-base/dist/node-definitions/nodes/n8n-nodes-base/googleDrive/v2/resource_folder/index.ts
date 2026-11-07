/**
 * Google Drive - Folder Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleDriveV2FolderCreateNode } from './operation_create';
import type { GoogleDriveV2FolderDeleteNode } from './operation_delete';
import type { GoogleDriveV2FolderShareNode } from './operation_share';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_share';

export type GoogleDriveV2FolderNode =
  | GoogleDriveV2FolderCreateNode
  | GoogleDriveV2FolderDeleteNode
  | GoogleDriveV2FolderShareNode
  ;