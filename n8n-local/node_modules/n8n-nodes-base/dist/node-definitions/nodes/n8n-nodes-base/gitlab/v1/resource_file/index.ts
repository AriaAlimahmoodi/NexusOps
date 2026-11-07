/**
 * GitLab - File Resource
 * Re-exports all operation types for this resource.
 */

import type { GitlabV1FileCreateNode } from './operation_create';
import type { GitlabV1FileDeleteNode } from './operation_delete';
import type { GitlabV1FileEditNode } from './operation_edit';
import type { GitlabV1FileGetNode } from './operation_get';
import type { GitlabV1FileListNode } from './operation_list';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_edit';
export * from './operation_get';
export * from './operation_list';

export type GitlabV1FileNode =
  | GitlabV1FileCreateNode
  | GitlabV1FileDeleteNode
  | GitlabV1FileEditNode
  | GitlabV1FileGetNode
  | GitlabV1FileListNode
  ;