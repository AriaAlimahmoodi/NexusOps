/**
 * HubSpot Node - Version 2.1
 * Re-exports all discriminator combinations.
 */

import type { HubspotV21CompanyNode } from './resource_company';
import type { HubspotV21ContactNode } from './resource_contact';
import type { HubspotV21ContactListNode } from './resource_contact_list';
import type { HubspotV21DealNode } from './resource_deal';
import type { HubspotV21EngagementNode } from './resource_engagement';
import type { HubspotV21TicketNode } from './resource_ticket';

export * from './resource_company';
export * from './resource_contact';
export * from './resource_contact_list';
export * from './resource_deal';
export * from './resource_engagement';
export * from './resource_ticket';

export type HubspotV21Node =
  | HubspotV21CompanyNode
  | HubspotV21ContactNode
  | HubspotV21ContactListNode
  | HubspotV21DealNode
  | HubspotV21EngagementNode
  | HubspotV21TicketNode
  ;