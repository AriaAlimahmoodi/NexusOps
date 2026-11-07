/**
 * Taiga - Issue Resource
 * Re-exports all operation types for this resource.
 */

import type { TaigaV1IssueCreateNode } from './operation_create';
import type { TaigaV1IssueDeleteNode } from './operation_delete';
import type { TaigaV1IssueGetNode } from './operation_get';
import type { TaigaV1IssueGetAllNode } from './operation_get_all';
import type { TaigaV1IssueUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type TaigaV1IssueNode =
  | TaigaV1IssueCreateNode
  | TaigaV1IssueDeleteNode
  | TaigaV1IssueGetNode
  | TaigaV1IssueGetAllNode
  | TaigaV1IssueUpdateNode
  ;