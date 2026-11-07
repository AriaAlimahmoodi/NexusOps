/**
 * n8n - Credential Resource
 * Re-exports all operation types for this resource.
 */

import type { N8nV1CredentialCreateNode } from './operation_create';
import type { N8nV1CredentialDeleteNode } from './operation_delete';
import type { N8nV1CredentialGetSchemaNode } from './operation_get_schema';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_schema';

export type N8nV1CredentialNode =
  | N8nV1CredentialCreateNode
  | N8nV1CredentialDeleteNode
  | N8nV1CredentialGetSchemaNode
  ;