/**
 * GitHub - File Resource
 * Re-exports all operation types for this resource.
 */

import type { GithubV1FileCreateNode } from './operation_create';
import type { GithubV1FileDeleteNode } from './operation_delete';
import type { GithubV1FileEditNode } from './operation_edit';
import type { GithubV1FileGetNode } from './operation_get';
import type { GithubV1FileListNode } from './operation_list';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_edit';
export * from './operation_get';
export * from './operation_list';

export type GithubV1FileNode =
  | GithubV1FileCreateNode
  | GithubV1FileDeleteNode
  | GithubV1FileEditNode
  | GithubV1FileGetNode
  | GithubV1FileListNode
  ;