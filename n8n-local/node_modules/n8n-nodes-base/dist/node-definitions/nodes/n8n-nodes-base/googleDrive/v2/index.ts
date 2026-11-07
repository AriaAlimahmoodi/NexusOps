/**
 * Google Drive Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { GoogleDriveV2DriveNode } from './resource_drive';
import type { GoogleDriveV2FileNode } from './resource_file';
import type { GoogleDriveV2FolderNode } from './resource_folder';

export * from './resource_drive';
export * from './resource_file';
export * from './resource_folder';

export type GoogleDriveV2Node =
  | GoogleDriveV2DriveNode
  | GoogleDriveV2FileNode
  | GoogleDriveV2FolderNode
  ;