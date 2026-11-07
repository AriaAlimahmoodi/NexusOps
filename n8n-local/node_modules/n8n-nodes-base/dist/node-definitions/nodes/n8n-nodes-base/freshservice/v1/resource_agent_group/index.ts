/**
 * Freshservice - AgentGroup Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshserviceV1AgentGroupCreateNode } from './operation_create';
import type { FreshserviceV1AgentGroupDeleteNode } from './operation_delete';
import type { FreshserviceV1AgentGroupGetNode } from './operation_get';
import type { FreshserviceV1AgentGroupGetAllNode } from './operation_get_all';
import type { FreshserviceV1AgentGroupUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshserviceV1AgentGroupNode =
  | FreshserviceV1AgentGroupCreateNode
  | FreshserviceV1AgentGroupDeleteNode
  | FreshserviceV1AgentGroupGetNode
  | FreshserviceV1AgentGroupGetAllNode
  | FreshserviceV1AgentGroupUpdateNode
  ;