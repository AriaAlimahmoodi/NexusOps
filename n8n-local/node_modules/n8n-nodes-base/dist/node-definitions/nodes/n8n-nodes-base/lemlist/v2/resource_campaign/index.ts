/**
 * Lemlist - Campaign Resource
 * Re-exports all operation types for this resource.
 */

import type { LemlistV2CampaignGetAllNode } from './operation_get_all';
import type { LemlistV2CampaignGetStatsNode } from './operation_get_stats';

export * from './operation_get_all';
export * from './operation_get_stats';

export type LemlistV2CampaignNode =
  | LemlistV2CampaignGetAllNode
  | LemlistV2CampaignGetStatsNode
  ;