/**
 * HubSpot Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { HubspotV1CompanyNode } from './resource_company';
import type { HubspotV1ContactNode } from './resource_contact';
import type { HubspotV1ContactListNode } from './resource_contact_list';
import type { HubspotV1DealNode } from './resource_deal';
import type { HubspotV1EngagementNode } from './resource_engagement';
import type { HubspotV1FormNode } from './resource_form';
import type { HubspotV1TicketNode } from './resource_ticket';

export * from './resource_company';
export * from './resource_contact';
export * from './resource_contact_list';
export * from './resource_deal';
export * from './resource_engagement';
export * from './resource_form';
export * from './resource_ticket';

export type HubspotV1Node =
  | HubspotV1CompanyNode
  | HubspotV1ContactNode
  | HubspotV1ContactListNode
  | HubspotV1DealNode
  | HubspotV1EngagementNode
  | HubspotV1FormNode
  | HubspotV1TicketNode
  ;