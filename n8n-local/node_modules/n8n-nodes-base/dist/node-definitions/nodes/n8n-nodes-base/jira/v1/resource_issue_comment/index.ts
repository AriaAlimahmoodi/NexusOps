/**
 * Jira Software - IssueComment Resource
 * Re-exports all operation types for this resource.
 */

import type { JiraV1IssueCommentAddNode } from './operation_add';
import type { JiraV1IssueCommentGetNode } from './operation_get';
import type { JiraV1IssueCommentGetAllNode } from './operation_get_all';
import type { JiraV1IssueCommentRemoveNode } from './operation_remove';
import type { JiraV1IssueCommentUpdateNode } from './operation_update';

export * from './operation_add';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_remove';
export * from './operation_update';

export type JiraV1IssueCommentNode =
  | JiraV1IssueCommentAddNode
  | JiraV1IssueCommentGetNode
  | JiraV1IssueCommentGetAllNode
  | JiraV1IssueCommentRemoveNode
  | JiraV1IssueCommentUpdateNode
  ;