/**
 * Zendesk Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { ZendeskV1TicketNode } from './resource_ticket';
import type { ZendeskV1TicketFieldNode } from './resource_ticket_field';
import type { ZendeskV1UserNode } from './resource_user';
import type { ZendeskV1OrganizationNode } from './resource_organization';

export * from './resource_ticket';
export * from './resource_ticket_field';
export * from './resource_user';
export * from './resource_organization';

export type ZendeskV1Node =
  | ZendeskV1TicketNode
  | ZendeskV1TicketFieldNode
  | ZendeskV1UserNode
  | ZendeskV1OrganizationNode
  ;