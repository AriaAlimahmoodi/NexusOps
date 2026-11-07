/**
 * Nextcloud - Folder Resource
 * Re-exports all operation types for this resource.
 */

import type { NextCloudV1FolderCopyNode } from './operation_copy';
import type { NextCloudV1FolderCreateNode } from './operation_create';
import type { NextCloudV1FolderDeleteNode } from './operation_delete';
import type { NextCloudV1FolderListNode } from './operation_list';
import type { NextCloudV1FolderMoveNode } from './operation_move';
import type { NextCloudV1FolderShareNode } from './operation_share';

export * from './operation_copy';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_list';
export * from './operation_move';
export * from './operation_share';

export type NextCloudV1FolderNode =
  | NextCloudV1FolderCopyNode
  | NextCloudV1FolderCreateNode
  | NextCloudV1FolderDeleteNode
  | NextCloudV1FolderListNode
  | NextCloudV1FolderMoveNode
  | NextCloudV1FolderShareNode
  ;