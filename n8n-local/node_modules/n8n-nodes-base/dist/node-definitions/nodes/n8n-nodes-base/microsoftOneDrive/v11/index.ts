/**
 * Microsoft OneDrive Node - Version 1.1
 * Re-exports all discriminator combinations.
 */

import type { MicrosoftOneDriveV11FileNode } from './resource_file';
import type { MicrosoftOneDriveV11FolderNode } from './resource_folder';

export * from './resource_file';
export * from './resource_folder';

export type MicrosoftOneDriveV11Node =
  | MicrosoftOneDriveV11FileNode
  | MicrosoftOneDriveV11FolderNode
  ;