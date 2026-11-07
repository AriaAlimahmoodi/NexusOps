/**
 * GitHub - File Resource
 * Re-exports all operation types for this resource.
 */

import type { GithubV11FileCreateNode } from './operation_create';
import type { GithubV11FileDeleteNode } from './operation_delete';
import type { GithubV11FileEditNode } from './operation_edit';
import type { GithubV11FileGetNode } from './operation_get';
import type { GithubV11FileListNode } from './operation_list';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_edit';
export * from './operation_get';
export * from './operation_list';

export type GithubV11FileNode =
  | GithubV11FileCreateNode
  | GithubV11FileDeleteNode
  | GithubV11FileEditNode
  | GithubV11FileGetNode
  | GithubV11FileListNode
  ;