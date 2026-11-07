/**
 * Mautic Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MauticV1CampaignContactNode } from './resource_campaign_contact';
import type { MauticV1CompanyNode } from './resource_company';
import type { MauticV1CompanyContactNode } from './resource_company_contact';
import type { MauticV1ContactNode } from './resource_contact';
import type { MauticV1ContactSegmentNode } from './resource_contact_segment';
import type { MauticV1SegmentEmailNode } from './resource_segment_email';

export * from './resource_campaign_contact';
export * from './resource_company';
export * from './resource_company_contact';
export * from './resource_contact';
export * from './resource_contact_segment';
export * from './resource_segment_email';

export type MauticV1Node =
  | MauticV1CampaignContactNode
  | MauticV1CompanyNode
  | MauticV1CompanyContactNode
  | MauticV1ContactNode
  | MauticV1ContactSegmentNode
  | MauticV1SegmentEmailNode
  ;