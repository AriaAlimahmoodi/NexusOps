/**
 * GitHub - Workflow Resource
 * Re-exports all operation types for this resource.
 */

import type { GithubV11WorkflowDisableNode } from './operation_disable';
import type { GithubV11WorkflowDispatchNode } from './operation_dispatch';
import type { GithubV11WorkflowDispatchAndWaitNode } from './operation_dispatch_and_wait';
import type { GithubV11WorkflowEnableNode } from './operation_enable';
import type { GithubV11WorkflowGetNode } from './operation_get';
import type { GithubV11WorkflowGetUsageNode } from './operation_get_usage';
import type { GithubV11WorkflowListNode } from './operation_list';

export * from './operation_disable';
export * from './operation_dispatch';
export * from './operation_dispatch_and_wait';
export * from './operation_enable';
export * from './operation_get';
export * from './operation_get_usage';
export * from './operation_list';

export type GithubV11WorkflowNode =
  | GithubV11WorkflowDisableNode
  | GithubV11WorkflowDispatchNode
  | GithubV11WorkflowDispatchAndWaitNode
  | GithubV11WorkflowEnableNode
  | GithubV11WorkflowGetNode
  | GithubV11WorkflowGetUsageNode
  | GithubV11WorkflowListNode
  ;