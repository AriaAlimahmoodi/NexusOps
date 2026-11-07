/**
 * GitLab - Issue Resource
 * Re-exports all operation types for this resource.
 */

import type { GitlabV1IssueCreateNode } from './operation_create';
import type { GitlabV1IssueCreateCommentNode } from './operation_create_comment';
import type { GitlabV1IssueEditNode } from './operation_edit';
import type { GitlabV1IssueGetNode } from './operation_get';
import type { GitlabV1IssueLockNode } from './operation_lock';

export * from './operation_create';
export * from './operation_create_comment';
export * from './operation_edit';
export * from './operation_get';
export * from './operation_lock';

export type GitlabV1IssueNode =
  | GitlabV1IssueCreateNode
  | GitlabV1IssueCreateCommentNode
  | GitlabV1IssueEditNode
  | GitlabV1IssueGetNode
  | GitlabV1IssueLockNode
  ;