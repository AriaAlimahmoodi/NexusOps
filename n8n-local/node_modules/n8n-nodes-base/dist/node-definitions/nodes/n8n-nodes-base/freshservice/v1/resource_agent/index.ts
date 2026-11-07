/**
 * Freshservice - Agent Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshserviceV1AgentCreateNode } from './operation_create';
import type { FreshserviceV1AgentDeleteNode } from './operation_delete';
import type { FreshserviceV1AgentGetNode } from './operation_get';
import type { FreshserviceV1AgentGetAllNode } from './operation_get_all';
import type { FreshserviceV1AgentUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshserviceV1AgentNode =
  | FreshserviceV1AgentCreateNode
  | FreshserviceV1AgentDeleteNode
  | FreshserviceV1AgentGetNode
  | FreshserviceV1AgentGetAllNode
  | FreshserviceV1AgentUpdateNode
  ;