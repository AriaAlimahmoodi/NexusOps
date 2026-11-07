/**
 * Google Ads - Campaign Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleAdsV1CampaignGetNode } from './operation_get';
import type { GoogleAdsV1CampaignGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type GoogleAdsV1CampaignNode =
  | GoogleAdsV1CampaignGetNode
  | GoogleAdsV1CampaignGetAllNode
  ;