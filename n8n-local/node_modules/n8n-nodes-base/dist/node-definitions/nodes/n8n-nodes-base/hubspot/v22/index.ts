/**
 * HubSpot Node - Version 2.2
 * Re-exports all discriminator combinations.
 */

import type { HubspotV22CompanyNode } from './resource_company';
import type { HubspotV22ContactNode } from './resource_contact';
import type { HubspotV22ContactListNode } from './resource_contact_list';
import type { HubspotV22DealNode } from './resource_deal';
import type { HubspotV22EngagementNode } from './resource_engagement';
import type { HubspotV22TicketNode } from './resource_ticket';

export * from './resource_company';
export * from './resource_contact';
export * from './resource_contact_list';
export * from './resource_deal';
export * from './resource_engagement';
export * from './resource_ticket';

export type HubspotV22Node =
  | HubspotV22CompanyNode
  | HubspotV22ContactNode
  | HubspotV22ContactListNode
  | HubspotV22DealNode
  | HubspotV22EngagementNode
  | HubspotV22TicketNode
  ;