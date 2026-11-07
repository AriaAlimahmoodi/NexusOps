/**
 * Linear - Issue Resource
 * Re-exports all operation types for this resource.
 */

import type { LinearV11IssueAddLinkNode } from './operation_add_link';
import type { LinearV11IssueCreateNode } from './operation_create';
import type { LinearV11IssueDeleteNode } from './operation_delete';
import type { LinearV11IssueGetNode } from './operation_get';
import type { LinearV11IssueGetAllNode } from './operation_get_all';
import type { LinearV11IssueUpdateNode } from './operation_update';

export * from './operation_add_link';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type LinearV11IssueNode =
  | LinearV11IssueAddLinkNode
  | LinearV11IssueCreateNode
  | LinearV11IssueDeleteNode
  | LinearV11IssueGetNode
  | LinearV11IssueGetAllNode
  | LinearV11IssueUpdateNode
  ;