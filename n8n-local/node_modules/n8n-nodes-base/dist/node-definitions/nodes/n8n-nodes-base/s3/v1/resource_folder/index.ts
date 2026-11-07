/**
 * S3 - Folder Resource
 * Re-exports all operation types for this resource.
 */

import type { S3V1FolderCreateNode } from './operation_create';
import type { S3V1FolderDeleteNode } from './operation_delete';
import type { S3V1FolderGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';

export type S3V1FolderNode =
  | S3V1FolderCreateNode
  | S3V1FolderDeleteNode
  | S3V1FolderGetAllNode
  ;