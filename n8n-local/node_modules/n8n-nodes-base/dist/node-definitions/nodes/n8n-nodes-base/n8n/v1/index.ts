/**
 * n8n Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { N8nV1AuditNode } from './resource_audit';
import type { N8nV1CredentialNode } from './resource_credential';
import type { N8nV1ExecutionNode } from './resource_execution';
import type { N8nV1WorkflowNode } from './resource_workflow';

export * from './resource_audit';
export * from './resource_credential';
export * from './resource_execution';
export * from './resource_workflow';

export type N8nV1Node =
  | N8nV1AuditNode
  | N8nV1CredentialNode
  | N8nV1ExecutionNode
  | N8nV1WorkflowNode
  ;