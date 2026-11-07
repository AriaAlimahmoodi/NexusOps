/**
 * n8n - Workflow Resource
 * Re-exports all operation types for this resource.
 */

import type { N8nV1WorkflowActivateNode } from './operation_activate';
import type { N8nV1WorkflowCreateNode } from './operation_create';
import type { N8nV1WorkflowDeactivateNode } from './operation_deactivate';
import type { N8nV1WorkflowDeleteNode } from './operation_delete';
import type { N8nV1WorkflowGetNode } from './operation_get';
import type { N8nV1WorkflowGetAllNode } from './operation_get_all';
import type { N8nV1WorkflowGetVersionNode } from './operation_get_version';
import type { N8nV1WorkflowUpdateNode } from './operation_update';

export * from './operation_activate';
export * from './operation_create';
export * from './operation_deactivate';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_version';
export * from './operation_update';

export type N8nV1WorkflowNode =
  | N8nV1WorkflowActivateNode
  | N8nV1WorkflowCreateNode
  | N8nV1WorkflowDeactivateNode
  | N8nV1WorkflowDeleteNode
  | N8nV1WorkflowGetNode
  | N8nV1WorkflowGetAllNode
  | N8nV1WorkflowGetVersionNode
  | N8nV1WorkflowUpdateNode
  ;