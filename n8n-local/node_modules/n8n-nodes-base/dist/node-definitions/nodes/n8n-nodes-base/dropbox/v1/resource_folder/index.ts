/**
 * Dropbox - Folder Resource
 * Re-exports all operation types for this resource.
 */

import type { DropboxV1FolderCopyNode } from './operation_copy';
import type { DropboxV1FolderCreateNode } from './operation_create';
import type { DropboxV1FolderDeleteNode } from './operation_delete';
import type { DropboxV1FolderListNode } from './operation_list';
import type { DropboxV1FolderMoveNode } from './operation_move';

export * from './operation_copy';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_list';
export * from './operation_move';

export type DropboxV1FolderNode =
  | DropboxV1FolderCopyNode
  | DropboxV1FolderCreateNode
  | DropboxV1FolderDeleteNode
  | DropboxV1FolderListNode
  | DropboxV1FolderMoveNode
  ;