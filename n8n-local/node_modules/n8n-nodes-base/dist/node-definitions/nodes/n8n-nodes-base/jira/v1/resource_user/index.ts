/**
 * Jira Software - User Resource
 * Re-exports all operation types for this resource.
 */

import type { JiraV1UserCreateNode } from './operation_create';
import type { JiraV1UserDeleteNode } from './operation_delete';
import type { JiraV1UserGetNode } from './operation_get';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';

export type JiraV1UserNode =
  | JiraV1UserCreateNode
  | JiraV1UserDeleteNode
  | JiraV1UserGetNode
  ;