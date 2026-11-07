/**
 * Linear - Issue Resource
 * Re-exports all operation types for this resource.
 */

import type { LinearV1IssueAddLinkNode } from './operation_add_link';
import type { LinearV1IssueCreateNode } from './operation_create';
import type { LinearV1IssueDeleteNode } from './operation_delete';
import type { LinearV1IssueGetNode } from './operation_get';
import type { LinearV1IssueGetAllNode } from './operation_get_all';
import type { LinearV1IssueUpdateNode } from './operation_update';

export * from './operation_add_link';
export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type LinearV1IssueNode =
  | LinearV1IssueAddLinkNode
  | LinearV1IssueCreateNode
  | LinearV1IssueDeleteNode
  | LinearV1IssueGetNode
  | LinearV1IssueGetAllNode
  | LinearV1IssueUpdateNode
  ;