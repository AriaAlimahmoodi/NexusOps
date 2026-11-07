/**
 * Jira Software Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { JiraV1IssueNode } from './resource_issue';
import type { JiraV1IssueAttachmentNode } from './resource_issue_attachment';
import type { JiraV1IssueCommentNode } from './resource_issue_comment';
import type { JiraV1UserNode } from './resource_user';

export * from './resource_issue';
export * from './resource_issue_attachment';
export * from './resource_issue_comment';
export * from './resource_user';

export type JiraV1Node =
  | JiraV1IssueNode
  | JiraV1IssueAttachmentNode
  | JiraV1IssueCommentNode
  | JiraV1UserNode
  ;