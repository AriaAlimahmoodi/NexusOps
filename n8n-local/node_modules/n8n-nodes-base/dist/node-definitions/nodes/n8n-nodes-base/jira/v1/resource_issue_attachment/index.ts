/**
 * Jira Software - IssueAttachment Resource
 * Re-exports all operation types for this resource.
 */

import type { JiraV1IssueAttachmentAddNode } from './operation_add';
import type { JiraV1IssueAttachmentGetNode } from './operation_get';
import type { JiraV1IssueAttachmentGetAllNode } from './operation_get_all';
import type { JiraV1IssueAttachmentRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_remove';

export type JiraV1IssueAttachmentNode =
  | JiraV1IssueAttachmentAddNode
  | JiraV1IssueAttachmentGetNode
  | JiraV1IssueAttachmentGetAllNode
  | JiraV1IssueAttachmentRemoveNode
  ;