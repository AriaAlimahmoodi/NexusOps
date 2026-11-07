/**
 * GitHub - Issue Resource
 * Re-exports all operation types for this resource.
 */

import type { GithubV1IssueCreateNode } from './operation_create';
import type { GithubV1IssueCreateCommentNode } from './operation_create_comment';
import type { GithubV1IssueEditNode } from './operation_edit';
import type { GithubV1IssueGetNode } from './operation_get';
import type { GithubV1IssueLockNode } from './operation_lock';

export * from './operation_create';
export * from './operation_create_comment';
export * from './operation_edit';
export * from './operation_get';
export * from './operation_lock';

export type GithubV1IssueNode =
  | GithubV1IssueCreateNode
  | GithubV1IssueCreateCommentNode
  | GithubV1IssueEditNode
  | GithubV1IssueGetNode
  | GithubV1IssueLockNode
  ;