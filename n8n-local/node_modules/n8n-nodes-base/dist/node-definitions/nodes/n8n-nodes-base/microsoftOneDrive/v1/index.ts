/**
 * Microsoft OneDrive Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MicrosoftOneDriveV1FileNode } from './resource_file';
import type { MicrosoftOneDriveV1FolderNode } from './resource_folder';

export * from './resource_file';
export * from './resource_folder';

export type MicrosoftOneDriveV1Node =
  | MicrosoftOneDriveV1FileNode
  | MicrosoftOneDriveV1FolderNode
  ;