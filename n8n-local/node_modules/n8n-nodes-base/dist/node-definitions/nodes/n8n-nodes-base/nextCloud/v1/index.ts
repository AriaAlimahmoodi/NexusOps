/**
 * Nextcloud Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { NextCloudV1FileNode } from './resource_file';
import type { NextCloudV1FolderNode } from './resource_folder';
import type { NextCloudV1UserNode } from './resource_user';

export * from './resource_file';
export * from './resource_folder';
export * from './resource_user';

export type NextCloudV1Node =
  | NextCloudV1FileNode
  | NextCloudV1FolderNode
  | NextCloudV1UserNode
  ;