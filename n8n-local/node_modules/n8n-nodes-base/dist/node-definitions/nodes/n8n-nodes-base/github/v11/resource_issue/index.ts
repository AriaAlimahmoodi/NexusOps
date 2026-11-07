/**
 * GitHub - Issue Resource
 * Re-exports all operation types for this resource.
 */

import type { GithubV11IssueCreateNode } from './operation_create';
import type { GithubV11IssueCreateCommentNode } from './operation_create_comment';
import type { GithubV11IssueEditNode } from './operation_edit';
import type { GithubV11IssueGetNode } from './operation_get';
import type { GithubV11IssueLockNode } from './operation_lock';

export * from './operation_create';
export * from './operation_create_comment';
export * from './operation_edit';
export * from './operation_get';
export * from './operation_lock';

export type GithubV11IssueNode =
  | GithubV11IssueCreateNode
  | GithubV11IssueCreateCommentNode
  | GithubV11IssueEditNode
  | GithubV11IssueGetNode
  | GithubV11IssueLockNode
  ;