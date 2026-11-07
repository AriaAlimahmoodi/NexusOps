/**
 * Freshservice Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { FreshserviceV1AgentNode } from './resource_agent';
import type { FreshserviceV1AgentGroupNode } from './resource_agent_group';
import type { FreshserviceV1AgentRoleNode } from './resource_agent_role';
import type { FreshserviceV1AnnouncementNode } from './resource_announcement';
import type { FreshserviceV1AssetTypeNode } from './resource_asset_type';
import type { FreshserviceV1ChangeNode } from './resource_change';
import type { FreshserviceV1DepartmentNode } from './resource_department';
import type { FreshserviceV1LocationNode } from './resource_location';
import type { FreshserviceV1ProblemNode } from './resource_problem';
import type { FreshserviceV1ProductNode } from './resource_product';
import type { FreshserviceV1ReleaseNode } from './resource_release';
import type { FreshserviceV1RequesterNode } from './resource_requester';
import type { FreshserviceV1RequesterGroupNode } from './resource_requester_group';
import type { FreshserviceV1SoftwareNode } from './resource_software';
import type { FreshserviceV1TicketNode } from './resource_ticket';

export * from './resource_agent';
export * from './resource_agent_group';
export * from './resource_agent_role';
export * from './resource_announcement';
export * from './resource_asset_type';
export * from './resource_change';
export * from './resource_department';
export * from './resource_location';
export * from './resource_problem';
export * from './resource_product';
export * from './resource_release';
export * from './resource_requester';
export * from './resource_requester_group';
export * from './resource_software';
export * from './resource_ticket';

export type FreshserviceV1Node =
  | FreshserviceV1AgentNode
  | FreshserviceV1AgentGroupNode
  | FreshserviceV1AgentRoleNode
  | FreshserviceV1AnnouncementNode
  | FreshserviceV1AssetTypeNode
  | FreshserviceV1ChangeNode
  | FreshserviceV1DepartmentNode
  | FreshserviceV1LocationNode
  | FreshserviceV1ProblemNode
  | FreshserviceV1ProductNode
  | FreshserviceV1ReleaseNode
  | FreshserviceV1RequesterNode
  | FreshserviceV1RequesterGroupNode
  | FreshserviceV1SoftwareNode
  | FreshserviceV1TicketNode
  ;