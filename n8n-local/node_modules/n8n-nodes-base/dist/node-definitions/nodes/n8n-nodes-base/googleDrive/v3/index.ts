/**
 * Google Drive Node - Version 3
 * Re-exports all discriminator combinations.
 */

import type { GoogleDriveV3FileNode } from './resource_file';
import type { GoogleDriveV3FileFolderNode } from './resource_file_folder';
import type { GoogleDriveV3FolderNode } from './resource_folder';
import type { GoogleDriveV3DriveNode } from './resource_drive';

export * from './resource_file';
export * from './resource_file_folder';
export * from './resource_folder';
export * from './resource_drive';

export type GoogleDriveV3Node =
  | GoogleDriveV3FileNode
  | GoogleDriveV3FileFolderNode
  | GoogleDriveV3FolderNode
  | GoogleDriveV3DriveNode
  ;