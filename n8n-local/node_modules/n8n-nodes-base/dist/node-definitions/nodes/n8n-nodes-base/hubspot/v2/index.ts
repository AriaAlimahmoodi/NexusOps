/**
 * HubSpot Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { HubspotV2CompanyNode } from './resource_company';
import type { HubspotV2ContactNode } from './resource_contact';
import type { HubspotV2ContactListNode } from './resource_contact_list';
import type { HubspotV2DealNode } from './resource_deal';
import type { HubspotV2EngagementNode } from './resource_engagement';
import type { HubspotV2TicketNode } from './resource_ticket';

export * from './resource_company';
export * from './resource_contact';
export * from './resource_contact_list';
export * from './resource_deal';
export * from './resource_engagement';
export * from './resource_ticket';

export type HubspotV2Node =
  | HubspotV2CompanyNode
  | HubspotV2ContactNode
  | HubspotV2ContactListNode
  | HubspotV2DealNode
  | HubspotV2EngagementNode
  | HubspotV2TicketNode
  ;