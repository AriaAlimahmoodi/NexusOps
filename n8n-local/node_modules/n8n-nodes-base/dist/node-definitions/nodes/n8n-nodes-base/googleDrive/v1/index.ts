/**
 * Google Drive Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GoogleDriveV1DriveNode } from './resource_drive';
import type { GoogleDriveV1FileNode } from './resource_file';
import type { GoogleDriveV1FolderNode } from './resource_folder';

export * from './resource_drive';
export * from './resource_file';
export * from './resource_folder';

export type GoogleDriveV1Node =
  | GoogleDriveV1DriveNode
  | GoogleDriveV1FileNode
  | GoogleDriveV1FolderNode
  ;