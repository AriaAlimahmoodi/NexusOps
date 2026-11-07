/**
 * GitHub - Workflow Resource
 * Re-exports all operation types for this resource.
 */

import type { GithubV1WorkflowDisableNode } from './operation_disable';
import type { GithubV1WorkflowDispatchNode } from './operation_dispatch';
import type { GithubV1WorkflowDispatchAndWaitNode } from './operation_dispatch_and_wait';
import type { GithubV1WorkflowEnableNode } from './operation_enable';
import type { GithubV1WorkflowGetNode } from './operation_get';
import type { GithubV1WorkflowGetUsageNode } from './operation_get_usage';
import type { GithubV1WorkflowListNode } from './operation_list';

export * from './operation_disable';
export * from './operation_dispatch';
export * from './operation_dispatch_and_wait';
export * from './operation_enable';
export * from './operation_get';
export * from './operation_get_usage';
export * from './operation_list';

export type GithubV1WorkflowNode =
  | GithubV1WorkflowDisableNode
  | GithubV1WorkflowDispatchNode
  | GithubV1WorkflowDispatchAndWaitNode
  | GithubV1WorkflowEnableNode
  | GithubV1WorkflowGetNode
  | GithubV1WorkflowGetUsageNode
  | GithubV1WorkflowListNode
  ;