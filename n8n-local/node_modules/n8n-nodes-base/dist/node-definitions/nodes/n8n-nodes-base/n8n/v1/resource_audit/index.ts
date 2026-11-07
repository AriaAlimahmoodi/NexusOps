/**
 * n8n - Audit Resource
 * Re-exports all operation types for this resource.
 */

import type { N8nV1AuditGenerateNode } from './operation_generate';

export * from './operation_generate';

export type N8nV1AuditNode = N8nV1AuditGenerateNode;