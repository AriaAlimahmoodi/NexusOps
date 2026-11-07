/**
 * Jira Software - Issue Resource
 * Re-exports all operation types for this resource.
 */

import type { JiraV1IssueChangelogNode } from './operation_changelog';
import type { JiraV1IssueCreateNode } from './operation_create';
import type { JiraV1IssueDeleteNode } from './operation_delete';
import type { JiraV1IssueGetNode } from './operation_get';
import type { JiraV1IssueGetAllNode } from './operation_get_all';
import type { JiraV1IssueNotifyNode } from './operation_notify';
import type { JiraV1IssueTransitionsNode } from './operation_transitions';
import type { JiraV1IssueUpdateNode } from './operation_update';

export * from './operation_changelog';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_notify';
export * from './operation_transitions';
export * from './operation_update';

export type JiraV1IssueNode =
  | JiraV1IssueChangelogNode
  | JiraV1IssueCreateNode
  | JiraV1IssueDeleteNode
  | JiraV1IssueGetNode
  | JiraV1IssueGetAllNode
  | JiraV1IssueNotifyNode
  | JiraV1IssueTransitionsNode
  | JiraV1IssueUpdateNode
  ;