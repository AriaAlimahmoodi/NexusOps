/**
 * Zammad Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { ZammadV1GroupNode } from './resource_group';
import type { ZammadV1OrganizationNode } from './resource_organization';
import type { ZammadV1TicketNode } from './resource_ticket';
import type { ZammadV1UserNode } from './resource_user';

export * from './resource_group';
export * from './resource_organization';
export * from './resource_ticket';
export * from './resource_user';

export type ZammadV1Node =
  | ZammadV1GroupNode
  | ZammadV1OrganizationNode
  | ZammadV1TicketNode
  | ZammadV1UserNode
  ;