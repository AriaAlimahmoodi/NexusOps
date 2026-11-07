/**
 * Emelia Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { EmeliaV1CampaignNode } from './resource_campaign';
import type { EmeliaV1ContactListNode } from './resource_contact_list';

export * from './resource_campaign';
export * from './resource_contact_list';

export type EmeliaV1Node =
  | EmeliaV1CampaignNode
  | EmeliaV1ContactListNode
  ;