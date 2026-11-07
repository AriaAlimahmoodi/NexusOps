/**
 * Freshservice - AgentRole Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshserviceV1AgentRoleGetNode } from './operation_get';
import type { FreshserviceV1AgentRoleGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type FreshserviceV1AgentRoleNode =
  | FreshserviceV1AgentRoleGetNode
  | FreshserviceV1AgentRoleGetAllNode
  ;