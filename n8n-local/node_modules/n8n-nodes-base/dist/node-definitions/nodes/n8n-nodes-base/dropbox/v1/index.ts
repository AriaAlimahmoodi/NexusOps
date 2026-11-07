/**
 * Dropbox Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { DropboxV1FileNode } from './resource_file';
import type { DropboxV1FolderNode } from './resource_folder';
import type { DropboxV1SearchNode } from './resource_search';

export * from './resource_file';
export * from './resource_folder';
export * from './resource_search';

export type DropboxV1Node =
  | DropboxV1FileNode
  | DropboxV1FolderNode
  | DropboxV1SearchNode
  ;